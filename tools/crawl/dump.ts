/**
 * Crawl helper: loads the reference implementation page, waits for the
 * client-rendered form, and dumps network chunks + a field inventory.
 *
 * Usage: bun run tools/crawl/dump.ts [url] [outDir]
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const url = process.argv[2] ?? "https://tofes101.co.il/forms/itc-101/submit/";
const outDir = process.argv[3] ?? "research/raw";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ channel: "chrome" });
const ctx = await browser.newContext({
  locale: "he-IL",
  timezoneId: "Asia/Jerusalem",
  viewport: { width: 1440, height: 1000 },
});
const page = await ctx.newPage();

const requests: { url: string; type: string; status?: number }[] = [];
page.on("response", (r) => {
  requests.push({ url: r.url(), type: r.request().resourceType(), status: r.status() });
});
const consoleMsgs: string[] = [];
page.on("console", (m) => consoleMsgs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => consoleMsgs.push(`[pageerror] ${e.message}`));

await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForTimeout(3000);

// Inventory: every interactive control on the page with its accessible name.
const inventory = await page.evaluate(() => {
  const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
  const labelledBy = (el: Element) => {
    const ids = el.getAttribute("aria-labelledby");
    if (!ids) return "";
    return ids
      .split(/\s+/)
      .map((id) => norm(document.getElementById(id)?.textContent))
      .join(" ");
  };
  const nameOf = (el: Element): string => {
    const lb = labelledBy(el);
    if (lb) return lb;
    const al = el.getAttribute("aria-label");
    if (al) return norm(al);
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) return norm(l.textContent);
    }
    const wrapping = el.closest("label");
    if (wrapping) return norm(wrapping.textContent);
    return norm((el as HTMLInputElement).placeholder || el.getAttribute("title"));
  };
  const describe = (el: Element, i: number) => {
    const e = el as HTMLInputElement;
    return {
      index: i,
      tag: el.tagName.toLowerCase(),
      type: e.type ?? null,
      inputMode: el.getAttribute("inputmode"),
      name: e.name || null,
      id: el.id || null,
      label: nameOf(el),
      placeholder: e.placeholder || null,
      required: e.required ?? null,
      disabled: e.disabled ?? null,
      readOnly: e.readOnly ?? null,
      autocomplete: el.getAttribute("autocomplete"),
      pattern: el.getAttribute("pattern"),
      maxLength: el.getAttribute("maxlength"),
      role: el.getAttribute("role"),
      aria: {
        describedby: el.getAttribute("aria-describedby"),
        invalid: el.getAttribute("aria-invalid"),
        required: el.getAttribute("aria-required"),
        checked: el.getAttribute("aria-checked"),
        expanded: el.getAttribute("aria-expanded"),
        controls: el.getAttribute("aria-controls"),
      },
      value: e.type === "checkbox" || e.type === "radio" ? String(e.checked) : (e.value ?? "").slice(0, 60),
      options: el.tagName === "SELECT" ? Array.from((el as HTMLSelectElement).options).map((o) => `${o.value}=${norm(o.text)}`) : undefined,
      closestFieldsetLegend: norm(el.closest("fieldset")?.querySelector("legend")?.textContent),
      requiredMark: !!el.closest("[data-required], .required"),
    };
  };
  const els = Array.from(
    document.querySelectorAll("input, select, textarea, button, [role=button], [role=tab], [role=radio], [role=checkbox], [role=combobox], [contenteditable=true]"),
  ).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  return {
    title: document.title,
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    headings: Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => ({
      level: h.tagName.toLowerCase(),
      text: norm(h.textContent),
    })),
    landmarks: Array.from(document.querySelectorAll("header,nav,main,aside,footer,form,[role=main],[role=navigation],[role=form]")).map((el) => ({
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role"),
      label: el.getAttribute("aria-label"),
      text: norm(el.textContent).slice(0, 80),
    })),
    controls: els.map(describe),
    liveRegions: Array.from(document.querySelectorAll("[aria-live],[role=status],[role=alert],[role=log]")).map((el) => ({
      role: el.getAttribute("role"),
      live: el.getAttribute("aria-live"),
      text: norm(el.textContent).slice(0, 200),
    })),
  };
});

const html = await page.content();
writeFileSync(`${outDir}/rendered.html`, html);
writeFileSync(`${outDir}/inventory.json`, JSON.stringify(inventory, null, 2));
writeFileSync(`${outDir}/network.json`, JSON.stringify(requests, null, 2));
writeFileSync(`${outDir}/console.txt`, consoleMsgs.join("\n"));
writeFileSync(`${outDir}/visible-text.txt`, await page.evaluate(() => document.body.innerText));

await page.screenshot({ path: `${outDir}/full.png`, fullPage: true });
await browser.close();

console.log(JSON.stringify({ controls: inventory.controls.length, headings: inventory.headings.length, requests: requests.length }, null, 2));
