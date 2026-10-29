/**
 * Extracts the itc-101 form definition from the "tepez" form-runner API dump
 * (research/raw/start.json) into a flat, analysis-friendly JSON + a readable
 * outline.
 *
 *   bun run tools/crawl/extract-form.ts
 *
 * Output:
 *   research/raw/form/tree.json      flat node list with paths
 *   research/raw/form/outline.txt    indented human outline (labels + logic)
 *   research/raw/form/steps.json     section-level steps only
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = process.argv[2] ?? "research/raw/start.json";
const OUT = "research/raw/form";
mkdirSync(OUT, { recursive: true });

type Node = Record<string, any>;
const raw = JSON.parse(readFileSync(SRC, "utf8")) as Node;
const schema = raw.formSchema ?? raw;
const root: Node = schema.rootElem;

const HIDDEN_NAME = /^(debug|ad|advertiser|options|row\d+|content\d+|alert\d+|expression\d+|_|__)/;

const flat: Node[] = [];

function kindOf(n: Node): string {
  return String(n.type ?? "unknown");
}

function walk(n: Node, path: string, depth: number, parent?: Node) {
  const name = n.name ?? "?";
  const id = path ? `${path}/${name}` : name;
  const rec: Node = {
    id,
    name,
    type: kindOf(n),
    depth,
    label: n.label ?? n.secLegend ?? null,
    required: n.reqValidator === true ? true : n.reqValidator ? n.reqValidator : undefined,
    help: n.helpText ?? undefined,
    placeholder: n.placeholder ?? undefined,
    options: summarizeOptions(n.options),
    validators: Array.isArray(n.validators)
      ? n.validators.map((v: Node) => ({
          type: v.type,
          message: v.message,
          fn: v.fn,
          pattern: v.pattern,
        }))
      : n.validators,
    relevant: n.relevant ?? undefined,
    equation: n.eqEquation ?? undefined,
    watch: n.eqWatchExpr ?? undefined,
    content: typeof n.content === "string" ? n.content.slice(0, 400) : undefined,
    show: n.show === undefined ? undefined : n.show,
    cols: n.cols ?? undefined,
    secType: n.secType ?? undefined,
    children: Array.isArray(n.children) ? n.children.length : 0,
  };
  for (const k of Object.keys(rec)) if (rec[k] === undefined) delete rec[k];
  flat.push(rec);

  const kids = n.children;
  if (Array.isArray(kids)) {
    for (const c of kids) {
      if (Array.isArray(c)) {
        // cRow puts one array per column
        for (const cc of c) if (cc && typeof cc === "object") walk(cc, id, depth + 1, n);
      } else if (c && typeof c === "object") {
        walk(c, id, depth + 1, n);
      }
    }
  }
}

function summarizeOptions(o: any) {
  if (o == null) return undefined;
  if (Array.isArray(o)) return o.slice(0, 40);
  if (typeof o === "string") return { expression: o.slice(0, 120) };
  return o;
}

walk(root, "", 0);

writeFileSync(`${OUT}/tree.json`, JSON.stringify(flat, null, 2));

const lines: string[] = [];
for (const r of flat) {
  const pad = "  ".repeat(r.depth);
  const bits = [r.type, r.name];
  if (r.label) bits.push(`«${String(r.label).replace(/\s+/g, " ").slice(0, 90)}»`);
  if (r.required === true) bits.push("[required]");
  if (r.relevant) bits.push(`?=${String(r.relevant).slice(0, 90)}`);
  if (r.equation) bits.push(`=${String(r.equation).slice(0, 90)}`);
  if (Array.isArray(r.validators)) bits.push(`v:${r.validators.map((v: Node) => v.type).join(",")}`);
  else if (r.validators) bits.push("v:legacy");
  if (Array.isArray(r.options)) bits.push(`opts:${r.options.length}`);
  lines.push(pad + bits.join("  "));
}
writeFileSync(`${OUT}/outline.txt`, lines.join("\n"));

const steps = flat.filter((r) => r.type === "cSection" && r.depth <= 2);
writeFileSync(`${OUT}/steps.json`, JSON.stringify(steps, null, 2));

const counts: Record<string, number> = {};
for (const r of flat) counts[r.type] = (counts[r.type] ?? 0) + 1;
console.log(JSON.stringify({ nodes: flat.length, counts, topSections: steps.map((s) => s.id) }, null, 2));
