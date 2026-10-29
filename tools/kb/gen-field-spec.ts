/**
 * Generates the exhaustive field-spec document from the extracted reference
 * form schema (research/raw/form/tree.json).
 *
 *   bun run tools/kb/gen-field-spec.ts
 *   -> kb/flow/form-101-field-spec.md   (generated, do not hand-edit)
 *   -> kb/flow/form-101-schema.json     (normalized runtime schema)
 *
 * The narrative around the tables lives in kb/flow/form-101-service.md and is
 * hand-written; this file only produces the mechanical parts so it stays in
 * sync with the reference implementation.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

type Node = Record<string, any>;
const tree = JSON.parse(readFileSync("research/raw/form/tree.json", "utf8")) as Node[];

/** Sections of the real form, in official order (א..י + appendix). */
const SECTIONS: { id: string; letter: string; title: string }[] = [
  { id: "root/form/taxYearWrap", letter: "—", title: "שנת המס (בחירת שנה)" },
  { id: "root/form/employer", letter: "א", title: "פרטי המעסיק" },
  { id: "root/form/employee", letter: "ב", title: "פרטי העובד/ת" },
  { id: "root/form/childrenWrapper", letter: "ג", title: "פרטים על הילדים" },
  { id: "root/form/thisIncome", letter: "ד", title: "הכנסותיי ממעסיק זה" },
  { id: "root/form/otherIncomes", letter: "ה", title: "הכנסות אחרות" },
  { id: "root/form/spouse", letter: "ו", title: "פרטי בן/בת הזוג" },
  { id: "root/form/changesWrapper", letter: "ז", title: "שינויים במהלך השנה" },
  { id: "root/form/taxCreditRequest", letter: "ח", title: "בקשה לפטור או זיכוי ממס" },
  { id: "root/form/taxCoordinationRequest", letter: "ט", title: "תיאום מס" },
  { id: "root/form/_confirmation", letter: "י", title: "הצהרה וחתימה" },
  { id: "root/form/appendix", letter: "—", title: "נספח – מסמכים" },
];

const LEAF = new Set([
  "fInput",
  "fDate",
  "fBool",
  "fRadio",
  "fCheckbox",
  "fSelect",
  "fFile",
  "fSign",
  "fLngTxt",
  "fDoc",
]);

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function inSection(n: Node, sid: string) {
  return n.id === sid || n.id.startsWith(sid + "/");
}

function descendants(sid: string): Node[] {
  return tree.filter((n) => inSection(n, sid) && n.id !== sid && LEAF.has(n.type));
}

function optsCell(n: Node): string {
  const o = n.options;
  if (!o) return "";
  if (Array.isArray(o)) {
    return o
      .map((x: any) => (Array.isArray(x) ? `${esc(x[1])} (\`${esc(x[0])}\`)` : esc(x)))
      .join("<br>");
  }
  if (typeof o === "string") return `_dynamic_`;
  if (typeof o === "object" && o.expression) return `_dynamic_`;
  return "";
}

function validatorsCell(n: Node): string {
  const v = n.validators;
  if (!v) return n.required === true ? "" : "";
  if (!Array.isArray(v)) return "legacy";
  const map: Record<string, string> = {
    "num/digitsNum": "digits only",
    int: "integer",
    luhn: "Israeli ID check digit (Luhn)",
    function: "custom rule",
    "str/regex": "regex",
    "str/phone": "IL phone",
    "str/len": "length",
    "num/val": "numeric range",
    "str/val": "string match",
    date: "date range",
  };
  return v
    .map((x: Node) => {
      const base = map[x.type] ?? x.type;
      return x.fn ? `${base}: \`${esc(x.fn)}\`` : base;
    })
    .join("<br>");
}

function requiredCell(n: Node): string {
  if (n.required === true) return "**yes**";
  if (n.required && typeof n.required === "object")
    return `when \`${esc(JSON.stringify(n.required))}\``;
  return "";
}

/** Normalized schema for the app: only the real form, flattened per section. */
const normalized = {
  $comment:
    "Derived from the tofes101.co.il reference implementation (tepez form 5a704edf239da27488a8cd9c). Structural reference only — not legal advice.",
  sourceFormId: "5a704edf239da27488a8cd9c",
  taxYearNotice: "Reference form is labelled 'מעודכן לשנת 2026'",
  sections: SECTIONS.map((s) => ({
    id: s.id.replace("root/form/", ""),
    letter: s.letter,
    title: s.title,
    fields: descendants(s.id).map((n) => ({
      path: n.id.replace("root/form/", ""),
      name: n.name,
      type: n.type,
      label: n.label ?? undefined,
      required: n.required ?? false,
      visibleWhen: n.relevant ?? null,
      computed: n.equation ?? null,
      options: Array.isArray(n.options) ? n.options : null,
      validators: Array.isArray(n.validators)
        ? n.validators.map((v: Node) => ({ type: v.type, message: v.message, fn: v.fn }))
        : null,
      help: n.help ?? null,
    })),
  })),
};

mkdirSync("kb/flow", { recursive: true });
writeFileSync("kb/flow/form-101-schema.json", JSON.stringify(normalized, null, 2) + "\n");

const out: string[] = [];
out.push("---");
out.push("id: flow/form-101-field-spec");
out.push("title: מפרט שדות טופס 101 — Field specification (generated)");
out.push("type: flow");
out.push("status: verified");
out.push("confidence: verified");
out.push("updated: 2026-10-29");
out.push("tags: [form-101, fields, schema, reference]");
out.push("sources: [source/tofes101-form-runner-api]");
out.push("related: [flow/form-101-service, finding/tepez-form-runtime]");
out.push("up: flow/form-101-service");
out.push("---");
out.push("");
out.push("<!-- GENERATED FILE — do not edit by hand.");
out.push("     Regenerate: `bun run tools/kb/gen-field-spec.ts`");
out.push("     Source: research/raw/form/tree.json (extracted from the reference implementation). -->");
out.push("");
out.push("# מפרט שדות — טופס 101 (reference spec)");
out.push("");
out.push("Every field of the reference implementation, section by section, with its");
out.push("type, required flag, visibility expression, validators and options.");
out.push("Machine-readable twin: [form-101-schema.json](./form-101-schema.json).");
out.push("");
out.push("Legend: `visibleWhen` is a JavaScript expression evaluated by the form runtime");
out.push("against the section container (`container.*`) and the form model (`model.*`).");
out.push("`computed` means the field is not user-entered — it is written by an equation.");
out.push("");

for (const s of SECTIONS) {
  const leaves = descendants(s.id);
  out.push(`## ${s.letter}. ${s.title}`);
  out.push("");
  out.push(`<sub>section id: \`${s.id.replace("root/form/", "")}\` · ${leaves.length} fields</sub>`);
  out.push("");
  if (!leaves.length) {
    out.push("_No user-entered fields._");
    out.push("");
    continue;
  }
  out.push("| field | type | label | required | visible when | rules | options |");
  out.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const n of leaves) {
    const path = n.id.replace("root/form/", "");
    const vw = n.relevant ? `\`${esc(n.relevant).slice(0, 120)}\`` : "";
    out.push(
      `| \`${esc(path)}\` | ${n.type} | ${esc(n.label)} | ${requiredCell(n)} | ${vw} | ${validatorsCell(n)} | ${optsCell(n)} |`,
    );
  }
  out.push("");
  const computed = leaves.filter((n) => n.equation);
  if (computed.length) {
    out.push("**Computed fields in this section**");
    out.push("");
    for (const n of computed) {
      out.push(`- \`${n.name}\`: \`${esc(n.equation).slice(0, 220)}\``);
    }
    out.push("");
  }
}

writeFileSync("kb/flow/form-101-field-spec.md", out.join("\n") + "\n");

const fieldCount = SECTIONS.flatMap((s) => descendants(s.id)).length;
console.log(JSON.stringify({ sections: SECTIONS.length, fields: fieldCount }, null, 2));
