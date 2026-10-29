---
id: eng/i18n-rtl
title: i18n and RTL — Hebrew first, English from day one
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [i18n, rtl, hebrew, nuxt-ui, intl]
sources: [source/nuxt-ui-4-i18n, source/nuxt-ui-4-design-system]
related: [eng/architecture, ux/rtl-foundations, ux/bidi-mixed-content, ux/hebrew-typography, decision/adr-0004-v1-scope]
up: eng/architecture
---

# i18n and RTL

Hebrew is primary; English ships from day one (ADR-0004). The app has three
routes and no route-level locales, so the **implementation is a lightweight
composable**, not `@nuxtjs/i18n`:

- `app/composables/useLocale.ts` — reactive `he | en`, `t(key, vars)`, persistence
  in `localStorage('tofes101.locale')`, `toggle()`, `init()`.
- `app/locales/he.ts` / `en.ts` — plain typed objects; `MessageKey = keyof typeof he`
  makes a missing key a TypeScript error and keeps the schema able to reference
  message keys.
- `app/app.vue` — `UApp :locale` gets the **locale object** from
  `@nuxt/ui/locale` (`he`/`en`), and `useHead` sets `<html lang dir>`.

`@nuxtjs/i18n@10.6.0` was installed and verified in the scaffold (locale files,
`strategy: 'no_prefix'`, `_i18n/<hash>/he/messages.json` generated). It is the
upgrade path if we ever need route prefixes, plural rules, or lazy locale chunks;
the `t('key')` call sites stay the same. For two locales and three routes, the
composable is smaller and keeps the typed-key guarantee.

## 1. Current pattern

```ts
// app/composables/useLocale.ts (shape)
export type Locale = 'he' | 'en'
const messages = { he, en } as const
export type MessageKey = keyof typeof he
const STORAGE_KEY = 'tofes101.locale'

export function useLocale() {
  const locale = useState<Locale>('locale', () => 'he')
  const t = (key: MessageKey, vars?: Record<string, string | number>) => { /* interpolate {x} */ }
  function apply(l: Locale) { /* set + localStorage, try/catch */ }
  function init() { /* stored value, else navigator.language */ }
  function toggle() { apply(locale.value === 'he' ? 'en' : 'he') }
  return { locale, t, apply, init, toggle }
}
```

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import { he as uiHe, en as uiEn } from '@nuxt/ui/locale'
const { locale } = useLocale()
const uiLocale = computed(() => (locale.value === 'he' ? uiHe : uiEn))
useHead({
  htmlAttrs: {
    lang: () => (locale.value === 'he' ? 'he' : 'en'),
    dir: () => (locale.value === 'he' ? 'rtl' : 'ltr')
  }
})
</script>
<template><UApp :locale="uiLocale"><NuxtPage /></UApp></template>
```

Rules:

- `UApp` needs a **locale object**, not the string `'he'`. Passing a string is a
  common mistake (the orchestrator hit it).
- `init()` runs on mount; before that, SSR/static HTML is Hebrew RTL.
- The language toggle never changes the URL and never remounts the form.
- `t` falls back to the key, so a missing message is visible in review, never
  blank.

## 2. Document direction

- `<html lang dir>` is the only direction switch. Do not put `dir="rtl"` on
  individual layout components.
- `UApp` sets direction for its own components; the document attribute is still
  required for logical CSS, scrollbars and native inputs.
- English mode must be tested as a first-class LTR layout, not a mirror hack.

## 3. Logical CSS rules

- Use `ms-*`/`me-*`, `ps-*`/`pe-*`, `start-*`/`end-*`, `text-start`/`text-end`.
- Do not use `ml-*`, `mr-*`, `left-*`, `right-*`, `text-left`, `text-right` for
  layout.
- `flex-row` follows `dir`; use `flex-row-reverse` only for deliberate visual
  order, not to "fix" RTL.
- Mirror directional icons (arrows, chevrons, back/next) with
  `rtl:rotate-180` / `rtl:-scale-x-100`; never mirror clocks, logos, or the
  official form.
- Numbers, IDs, phones, emails, URLs, and code stay LTR inside RTL text: wrap in
  `<bdi dir="ltr">` or set `dir="ltr"` on the input. The repo already has a
  `.ltr` utility and applies it to `tel`/`email`/numeric inputs.
- Never reverse a string in JS to "fix" display.

## 4. Formatting (Intl, verified in node 22)

| Call | Output |
| --- | --- |
| `Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS'}).format(12345)` | `‏12,345.00 ‏₪` (contains U+200F + NBSP) |
| `Intl.NumberFormat('he-IL').format(12345.678)` | `12,345.678` |
| `Intl.NumberFormat('he-IL',{style:'percent'}).format(0.235)` | `24%` |
| `Intl.DateTimeFormat('he-IL',{dateStyle:'short'}).format(...)` | `29.10.2026` |
| `Intl.DateTimeFormat('he-IL',{dateStyle:'long'}).format(...)` | `29 באוקטובר 2026` |
| `Intl.RelativeTimeFormat('he',{numeric:'auto'}).format(-3,'day')` | `לפני 3 ימים` |

Consequences:

- Display formatting is `Intl`-driven; do not hand-roll `toLocaleString`.
- The RLM marks in the currency output are good for the DOM but must be stripped
  before drawing into a PDF (see [eng/pdf-hebrew-rtl](pdf-hebrew-rtl.md)).
- Store canonical values (ISO date `2026-10-29`, integer agorot or decimal
  number), format at the edge only.
- The official form expects `dd.mm.yyyy`; the print/PDF layer formats explicitly,
  never relying on the browser locale.

## 5. Hebrew input and labels

- `lang="he"` on the document (and inputs) so mobile keyboards/spellcheck match.
- Final letters (ך ם ן ף ץ) are typed by the user; do not "normalise" them.
- Do not trim inside names; allow `בן דוד`, `אבו-סנאן`, quotes (`בע"מ`), geresh.
- IDs: `inputmode="numeric"`, `autocomplete="off"`, keep leading zeros, validate
  with the Luhn check digit (schema validator, not the input).
- Phone: `inputmode="tel"`, `autocomplete="tel"`, allow `+972`, `0`, hyphens;
  normalise only for validation, display what the user typed.
- Labels/help are message keys, not Hebrew literals in components; the schema
  stores `labelKey`, `helpKey`.
- The declaration and legal wording are authored in Hebrew, reviewed, then
  translated; record which wording was signed (`locale` + `wordingVersion`) in
  the draft/PDF metadata.

## 6. Date and number inputs (open UX issues)

The spike revealed two Nuxt UI/RTL quirks to resolve with the UX track:

1. **`UInputDate`** with the `he` locale renders the segment placeholders in an
   order that reads `יום . חודש . שנה` inside an RTL field. The numeric date is
   still `dd.mm.yyyy`, but segment order/alignment needs a deliberate decision
   (force the segment group to `dir="ltr"`, or use three labelled selects). Test
   with keyboard-only users.
2. **`UInputNumber` currency** displayed `₪ 12,345.00` with the symbol leading in
   RTL, while `Intl` output is `12,345.00 ₪` (with RLM). Pick one presentation and
   apply it consistently in the form, review, print and PDF.
3. Never rely on the input's formatted string as the stored value; store the
   numeric value and format for display.

## 7. Language toggle

- A `he | en` switch in the header; persists in `localStorage` (preference only,
  never answers).
- Switching language must not clear answers or leave the step.
- `dir`/`lang` flip on `<html>`; test the whole form in English LTR, especially
  the print sheet.
- Legal texts: show a notice that the Hebrew wording prevails if the two differ.
- Do not machine-translate the declaration; a human-reviewed English text is a
  launch requirement.

## 8. Test matrix

- Hebrew RTL: 360/390/768/1280 px, all steps, print preview.
- English LTR: same, plus long labels (English is usually wider).
- Mixed content: ID, phone, email, amounts, dates, employer name with `בע"מ`.
- Keyboard: tab order follows visual order in both directions; focus rings
  visible.
- Axe: `html[lang]`, `dir`, labels, error associations.
- A missing key must fail TypeScript (`MessageKey`), not render a blank.
