#!/usr/bin/env bun
/**
 * Knowledge-graph builder for the kb/ folder.
 *
 *   bun run scripts/kb.ts          # build artifacts
 *   bun run scripts/kb.ts check    # validate + build, exit 1 on errors
 *   bun run scripts/kb.ts backlinks --write   # also inject "## Backlinks" into nodes
 *
 * Reads every *.md under kb/, parses YAML frontmatter, resolves edges
 * (related / up / sources / wikilinks / relative md links) and writes:
 *   kb/.generated/graph.json
 *   kb/.generated/BACKLINKS.md
 *   kb/.generated/ORPHANS.md
 *   kb/.generated/tree.txt
 *   kb/.generated/graph.html     (self-contained force-directed viewer)
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join, relative, dirname, resolve, basename } from "node:path";

const ROOT = "kb";
const GEN = join(ROOT, ".generated");
const args = process.argv.slice(2);
const CHECK = args.includes("check");
const WRITE_BACKLINKS = args.includes("--write");

type Node = {
  id: string;
  file: string;
  title: string;
  type: string;
  status: string;
  confidence: string;
  updated: string;
  tags: string[];
  sources: string[];
  related: string[];
  up?: string;
  dir: string;
  words: number;
};

const REQUIRED = ["id", "title", "type"] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e.startsWith(".") || e === "node_modules" || e === "assets") continue;
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Minimal YAML frontmatter parser: scalars + flow/block lists of scalars. */
function parseFrontmatter(text: string): { fm: Record<string, any>; body: string } {
  if (!text.startsWith("---\n")) return { fm: {}, body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { fm: {}, body: text };
  const raw = text.slice(4, end);
  const body = text.slice(text.indexOf("\n", end + 1) + 1);
  const fm: Record<string, any> = {};
  let key: string | null = null;
  for (const line of raw.split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const blockItem = line.match(/^\s+-\s+(.*)$/);
    if (blockItem && key) {
      if (!Array.isArray(fm[key])) fm[key] = [];
      fm[key].push(unquote(blockItem[1]));
      continue;
    }
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) continue;
    key = m[1];
    const v = m[2].trim();
    if (!v) {
      fm[key] = undefined;
      continue;
    }
    if (v.startsWith("[") && v.endsWith("]")) {
      const inner = v.slice(1, -1).trim();
      fm[key] = inner ? splitTopLevel(inner).map(unquote) : [];
    } else fm[key] = unquote(v);
  }
  return { fm, body };
}

function unquote(s: string): string {
  s = s.trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))
    return s.slice(1, -1);
  return s;
}

function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of s) {
    if (ch === "[" || ch === "(") depth++;
    if (ch === "]" || ch === ")") depth--;
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

const files = walk(ROOT).filter((f) => !f.includes("/.generated/"));
const nodes = new Map<string, Node>();
const errors: string[] = [];
const warnings: string[] = [];
const rawBodies = new Map<string, string>();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const { fm, body } = parseFrontmatter(text);
  const rel = relative(ROOT, file);
  if (rel === "CONVENTIONS.md") continue;
  const id = fm.id ?? rel.replace(/\.md$/, "");
  if (nodes.has(id)) errors.push(`duplicate id '${id}' in ${rel}`);
  for (const r of REQUIRED) if (!fm[r]) errors.push(`${rel}: missing frontmatter '${r}'`);
  const node: Node = {
    id,
    file: rel,
    title: fm.title ?? id,
    type: fm.type ?? "unknown",
    status: fm.status ?? "draft",
    confidence: fm.confidence ?? "unverified",
    updated: fm.updated ?? "",
    tags: arr(fm.tags),
    sources: arr(fm.sources),
    related: arr(fm.related),
    up: fm.up,
    dir: dirname(rel),
    words: body.split(/\s+/).filter(Boolean).length,
  };
  nodes.set(id, node);
  rawBodies.set(id, body);
}

function arr(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return [String(v)];
}

type Edge = { from: string; to: string; kind: string };
const edges: Edge[] = [];

const byFile = new Map<string, string>();
for (const n of nodes.values()) byFile.set(n.file, n.id);

function resolveTarget(fromNode: Node, target: string): string | null {
  const t = target.trim();
  // non-node repo docs (README, CONVENTIONS…) are allowed to be linked
  if (/(^|\/)(README|CONVENTIONS)\.md$/.test(t)) return "@external";
  if (nodes.has(t)) return t;
  // try as a relative md file
  const p = resolve(dirname(join(ROOT, fromNode.file)), t);
  const rel = relative(resolve(ROOT), p).replace(/\\/g, "/");
  if (byFile.has(rel)) return byFile.get(rel)!;
  if (byFile.has(rel + ".md")) return byFile.get(rel + ".md")!;
  if (nodes.has(rel)) return rel;
  if (nodes.has(rel.replace(/\.md$/, ""))) return rel.replace(/\.md$/, "");
  // try by file path relative to kb root
  const rel2 = t.replace(/^kb\//, "").replace(/^\.\//, "");
  if (nodes.has(rel2)) return rel2;
  if (nodes.has(rel2.replace(/\.md$/, ""))) return rel2.replace(/\.md$/, "");
  return null;
}

for (const node of nodes.values()) {
  for (const [kind, list] of [
    ["related", node.related],
    ["source", node.sources],
  ] as const) {
    for (const t of list) {
      const to = resolveTarget(node, t);
      if (!to) {
        warnings.push(`${node.file}: ${kind} target not found -> '${t}'`);
        continue;
      }
      to !== "@external" && edges.push({ from: node.id, to, kind });
    }
  }
  if (node.up) {
    const to = resolveTarget(node, node.up);
    if (!to) warnings.push(`${node.file}: up target not found -> '${node.up}'`);
    else to !== "@external" && edges.push({ from: node.id, to, kind: "up" });
  }
  const body = (rawBodies.get(node.id) ?? "")
    // ignore links inside fenced/inline code so prose examples don't register
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "");
  // wikilinks
  for (const m of body.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]/g)) {
    const to = resolveTarget(node, m[1]);
    if (!to) warnings.push(`${node.file}: wikilink not found -> '${m[1]}'`);
    else to !== "@external" && edges.push({ from: node.id, to, kind: "wikilink" });
  }
  // relative md links
  for (const m of body.matchAll(/\]\(([^)#\s]+\.md)(?:#[^)]*)?\)/g)) {
    if (/^https?:/.test(m[1])) continue;
    const to = resolveTarget(node, m[1]);
    if (!to) warnings.push(`${node.file}: md link not found -> '${m[1]}'`);
    else to !== "@external" && edges.push({ from: node.id, to, kind: "link" });
  }
}

// de-dupe edges
const seen = new Set<string>();
const uniq = edges.filter((e) => {
  const k = `${e.from}|${e.to}|${e.kind}`;
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

mkdirSync(GEN, { recursive: true });

const graph = {
  generatedAt: new Date().toISOString(),
  counts: {
    nodes: nodes.size,
    edges: uniq.length,
    errors: errors.length,
    warnings: warnings.length,
  },
  nodes: [...nodes.values()],
  edges: uniq,
  errors,
  warnings,
};
writeFileSync(join(GEN, "graph.json"), JSON.stringify(graph, null, 2) + "\n");

// backlinks
const back = new Map<string, { from: string; kind: string }[]>();
for (const e of uniq) {
  if (!back.has(e.to)) back.set(e.to, []);
  back.get(e.to)!.push({ from: e.from, kind: e.kind });
}

const byDir = new Map<string, Node[]>();
for (const n of [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id))) {
  const d = n.dir || ".";
  if (!byDir.has(d)) byDir.set(d, []);
  byDir.get(d)!.push(n);
}

const bl: string[] = [
  "# Backlinks (generated)",
  "",
  `_${nodes.size} nodes · ${uniq.length} edges · generated ${new Date().toISOString().slice(0, 16).replace("T", " ")}Z_`,
  "",
];
for (const [d, list] of [...byDir.entries()].sort()) {
  bl.push(`## ${d}/`, "");
  for (const n of list) {
    const bls = (back.get(n.id) ?? []).filter((b) => b.from !== n.id);
    const out = uniq.filter((e) => e.from === n.id);
    bl.push(`### ${n.title}  \`${n.id}\``, "");
    bl.push(
      `- type: **${n.type}** · status: ${n.status} · confidence: ${n.confidence} · ${n.words} words`,
    );
    if (n.tags.length) bl.push(`- tags: ${n.tags.join(", ")}`);
    bl.push(
      `- out (${out.length}): ${out.length ? out.map((e) => `\`${e.to}\` (${e.kind})`).join(", ") : "—"}`,
    );
    bl.push(
      `- **in (${bls.length})**: ${bls.length ? bls.map((b) => `\`${b.from}\` (${b.kind})`).join(", ") : "— nothing links here"}`,
    );
    bl.push("");
  }
}
writeFileSync(join(GEN, "BACKLINKS.md"), bl.join("\n"));

// orphans + broken
const inbound = new Map<string, number>();
for (const e of uniq) inbound.set(e.to, (inbound.get(e.to) ?? 0) + 1);
const orphans = [...nodes.values()].filter((n) => !inbound.get(n.id) && n.type !== "source");
const orphanMd = [
  "# Orphans & link health (generated)",
  "",
  "## Nodes nothing links to",
  "",
  ...(orphans.length ? orphans.map((o) => `- \`${o.id}\` — ${o.title} _(${o.file})_`) : ["_none_"]),
  "",
  "## Unresolved link targets",
  "",
  ...(warnings.length ? warnings.map((w) => `- ${w}`) : ["_none_"]),
  "",
  "## Errors",
  "",
  ...(errors.length ? errors.map((w) => `- ${w}`) : ["_none_"]),
  "",
];
writeFileSync(join(GEN, "ORPHANS.md"), orphanMd.join("\n"));

// up-tree
const tree: string[] = ["# up-tree (generated)", ""];
const roots = [...nodes.values()].filter((n) => !n.up || !nodes.has(n.up));
const kids = new Map<string, Node[]>();
for (const n of nodes.values()) {
  if (n.up && nodes.has(n.up)) {
    if (!kids.has(n.up)) kids.set(n.up, []);
    kids.get(n.up)!.push(n);
  }
}
function draw(n: Node, depth: number, seenSet: Set<string>) {
  if (seenSet.has(n.id) || depth > 6) return;
  seenSet.add(n.id);
  tree.push(`${"  ".repeat(depth)}- ${n.title}  \`${n.id}\``);
  for (const k of (kids.get(n.id) ?? []).sort((a, b) => a.id.localeCompare(b.id)))
    draw(k, depth + 1, seenSet);
}
for (const r of roots.sort((a, b) => a.id.localeCompare(b.id))) draw(r, 0, new Set());
writeFileSync(join(GEN, "tree.txt"), tree.join("\n") + "\n");

// optional: inject backlink sections
if (WRITE_BACKLINKS) {
  for (const n of nodes.values()) {
    const file = join(ROOT, n.file);
    let text = readFileSync(file, "utf8");
    const bls = (back.get(n.id) ?? []).filter((b) => b.from !== n.id);
    const block = [
      "<!-- kb:backlinks:start -->",
      "## Backlinks",
      "",
      ...(bls.length
        ? bls.map((b) => `- [[${b.from}]] _(${b.kind})_`)
        : ["_No node links here yet._"]),
      "<!-- kb:backlinks:end -->",
    ].join("\n");
    const re = /<!-- kb:backlinks:start -->[\s\S]*?<!-- kb:backlinks:end -->/;
    text = re.test(text) ? text.replace(re, block) : `${text.trimEnd()}\n\n${block}\n`;
    writeFileSync(file, text);
  }
}

// self-contained viewer
writeFileSync(join(GEN, "graph.html"), viewerHtml(graph));

console.log(
  JSON.stringify(
    {
      nodes: nodes.size,
      edges: uniq.length,
      orphans: orphans.length,
      warnings: warnings.length,
      errors: errors.length,
      out: `${GEN}/`,
    },
    null,
    2,
  ),
);
if (warnings.length) console.log("\nwarnings:\n" + warnings.slice(0, 40).map((w) => "  " + w).join("\n"));
if (errors.length) console.log("\nerrors:\n" + errors.map((w) => "  " + w).join("\n"));
if (CHECK && (errors.length || warnings.length)) process.exit(1);

function viewerHtml(graph: unknown): string {
  const data = JSON.stringify(graph);
  return `<!doctype html>
<html lang="he" dir="rtl"><meta charset="utf-8">
<title>tofes101 knowledge graph</title>
<style>
  :root{--bg:#0b0f14;--fg:#e6edf3;--dim:#8b949e;--line:#21262d;--acc:#4f9cf9}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:13px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;height:100vh;display:grid;grid-template-columns:1fr 340px;overflow:hidden}
  @media(max-width:900px){body{grid-template-columns:1fr;grid-template-rows:1fr auto}}
  canvas{width:100%;height:100%;display:block;cursor:grab}
  aside{border-inline-start:1px solid var(--line);padding:14px;overflow:auto;background:#0d1117}
  h1{font-size:14px;margin:0 0 8px}
  .muted{color:var(--dim)}
  input,select{width:100%;background:#161b22;border:1px solid var(--line);color:var(--fg);padding:7px 9px;border-radius:7px;font:inherit;margin-bottom:8px}
  a{color:var(--acc);text-decoration:none}
  ul{list-style:none;padding:0;margin:6px 0}
  li{padding:3px 0;border-bottom:1px solid #161b22}
  .pill{display:inline-block;font-size:10px;padding:1px 6px;border-radius:99px;background:#161b22;color:var(--dim);margin-inline-start:4px}
  .t-source{background:#1f2a1f;color:#7ee787}.t-law{background:#2a1f2a;color:#d2a8ff}
  .t-ux{background:#1f2633;color:#79c0ff}.t-eng{background:#2a2418;color:#e3b341}
  .t-flow{background:#2a1f1f;color:#ffa198}.t-finding{background:#1f2a2a;color:#56d4dd}
  .t-decision{background:#2a2a1f;color:#f2cc60}.t-product{background:#24202a;color:#c297ff}
  .legend{display:flex;flex-wrap:wrap;gap:4px;margin:8px 0}
</style>
<body>
<canvas id="c"></canvas>
<aside>
  <h1>tofes101 · knowledge graph</h1>
  <div class="muted" id="stats"></div>
  <div class="legend" id="legend"></div>
  <input id="q" placeholder="filter: id, title, tag…">
  <select id="type"><option value="">all types</option></select>
  <div id="list"></div>
</aside>
<script>
const G = ${data};
const nodes = G.nodes.map(n=>({...n}));
const byId = new Map(nodes.map(n=>[n.id,n]));
const edges = G.edges.map(e=>({...e}));
nodes.forEach((n,i)=>{n.x=Math.cos(i)*260+(Math.random()-.5)*40;n.y=Math.sin(i)*260+(Math.random()-.5)*40;n.vx=0;n.vy=0;n.r=Math.max(3,Math.min(11,Math.sqrt((n.words||0)/8)+3));});
const deg = new Map(); edges.forEach(e=>{deg.set(e.from,(deg.get(e.from)||0)+1);deg.set(e.to,(deg.get(e.to)||0)+1)});
document.getElementById('stats').textContent = nodes.length+' nodes · '+edges.length+' edges';
const types=[...new Set(nodes.map(n=>n.type))].sort();
const tsel=document.getElementById('type');types.forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=t;tsel.appendChild(o)});
document.getElementById('legend').innerHTML = types.map(t=>'<span class="pill t-'+t+'">'+t+'</span>').join('');
const c=document.getElementById('c'),ctx=c.getContext('2d');
let W=0,H=0,DPR=devicePixelRatio||1;
function resize(){W=c.clientWidth;H=c.clientHeight;c.width=W*DPR;c.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener('resize',resize);resize();
let tx=0,ty=0,scale=1,hover=null,drag=null,panning=null;
const mouse={x:0,y:0};
c.addEventListener('mousedown',e=>{const p=pick(e);if(p){drag=p}else{panning={x:e.clientX,y:e.clientY,tx,ty}}});
addEventListener('mouseup',()=>{drag=null;panning=null});
c.addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;
  if(drag){const w=toWorld(e.clientX,e.clientY);drag.x=w.x;drag.y=w.y;drag.fixed=true}
  else if(panning){tx=panning.tx+(e.clientX-panning.x);ty=panning.ty+(e.clientY-panning.y)}
  hover=pick(e);c.style.cursor=hover?'pointer':'grab'});
c.addEventListener('wheel',e=>{e.preventDefault();const k=e.deltaY<0?1.1:.9;scale=Math.max(.25,Math.min(4,scale*k))},{passive:false});
function toWorld(cx,cy){return {x:(cx-tx-W/2)/scale+W/2,y:(cy-ty-H/2)/scale+H/2}}
function pick(e){const w=toWorld(e.clientX,e.clientY);for(const n of nodes){const dx=n.x-w.x,dy=n.y-w.y;if(dx*dx+dy*dy<(n.r+6)**2)return n}return null}
function color(t){return {source:'#2ea043',law:'#a371f7',ux:'#58a6ff',eng:'#d29922',flow:'#f85149',finding:'#39c5cf',decision:'#e3b341',product:'#bc8cff',pattern:'#3fb950',field:'#ff7b72',glossary:'#8b949e',concept:'#db6d28'}[t]||'#8b949e'}
// simple force sim
let alpha=1;
function tick(){
  if(alpha>0.02){
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y;let d2=dx*dx+dy*dy||1;
      if(d2>90000)continue;const f=2600/d2;const d=Math.sqrt(d2);dx/=d;dy/=d;
      a.vx-=dx*f;a.vy-=dy*f;b.vx+=dx*f;b.vy+=dy*f;
    }
    for(const e of edges){const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;
      let dx=b.x-a.x,dy=b.y-a.y;const d=Math.sqrt(dx*dx+dy*dy)||1;const f=(d-110)*0.0015;
      dx/=d;dy/=d;a.vx+=dx*f*d;a.vy+=dy*f*d;b.vx-=dx*f*d;b.vy-=dy*f*d;}
    for(const n of nodes){if(n.fixed)continue;n.vx*=0.85;n.vy*=0.85;n.x+=n.vx;n.y+=n.vy;
      const d=Math.hypot(n.x,n.y)||1;if(d>900){n.vx-=n.x/d*2;n.vy-=n.y/d*2}}
    alpha*=0.995;
  }
  draw();requestAnimationFrame(tick);
}
function draw(){
  ctx.clearRect(0,0,W,H);
  ctx.save();ctx.translate(W/2+tx,H/2+ty);ctx.scale(scale,scale);ctx.translate(-W/2,-H/2);
  ctx.lineWidth=0.6;
  for(const e of edges){const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;
    ctx.strokeStyle = hover&&(hover.id===e.from||hover.id===e.to)?'#4f9cf9':'#1f2630';
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
  for(const n of nodes){
    ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,7);ctx.fillStyle=color(n.type);ctx.globalAlpha=n.status==='draft'?.55:1;ctx.fill();ctx.globalAlpha=1;
    if(hover===n){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.stroke();ctx.lineWidth=.6}
    if(scale>0.75||hover===n){ctx.fillStyle='#c9d1d9';ctx.font='10px ui-sans-serif';ctx.textAlign='center';
      const label=n.title.length>34?n.title.slice(0,32)+'…':n.title;
      ctx.fillText(label,n.x,n.y+n.r+11);}
  }
  ctx.restore();
}
function renderList(){
  const q=document.getElementById('q').value.toLowerCase().trim();
  const t=document.getElementById('type').value;
  const list=nodes.filter(n=>(!t||n.type===t)&&(!q||(n.id+' '+n.title+' '+(n.tags||[]).join(' ')).toLowerCase().includes(q)))
    .sort((a,b)=>(deg.get(b.id)||0)-(deg.get(a.id)||0)).slice(0,300);
  document.getElementById('list').innerHTML=list.map(n=>
    '<li><a href="#" data-id="'+n.id+'">'+n.title+'</a><span class="pill t-'+n.type+'">'+n.type+'</span>'+
    '<div class="muted" style="font-size:11px">'+n.id+' · '+n.words+'w · in '+(deg.get(n.id)||0)+'</div></li>').join('');
  document.querySelectorAll('#list a').forEach(a=>a.onclick=ev=>{ev.preventDefault();const n=byId.get(a.dataset.id);
    if(n){alpha=0.6;n.fixed=false;tx=W/2-n.x*scale;ty=H/2-n.y*scale;scale=1.4;hover=n;showNode(n)}});
}
function showNode(n){
  const out=edges.filter(e=>e.from===n.id),inn=edges.filter(e=>e.to===n.id);
  document.getElementById('list').innerHTML='<li><b>'+n.title+'</b><div class="muted">'+n.id+' · '+n.type+' · '+n.file+'</div></li>'+
   '<li class="muted">out: '+(out.map(e=>e.to).join(', ')||'—')+'</li>'+
   '<li class="muted">in: '+(inn.map(e=>e.from).join(', ')||'—')+'</li>'+
   '<li><a href="#" id="back">← back to list</a></li>';
  document.getElementById('back').onclick=ev=>{ev.preventDefault();renderList()};
}
document.getElementById('q').oninput=renderList;document.getElementById('type').onchange=renderList;
renderList();tick();
</script>
`;
}
