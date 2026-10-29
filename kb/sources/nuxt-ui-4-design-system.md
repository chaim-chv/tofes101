---
id: source/nuxt-ui-4-design-system
title: Nuxt UI 4 — Design system, semantic colors and app.config
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: Nuxt UI (ui.nuxt.com)
url: https://ui.nuxt.com/docs/getting-started/theme/design-system
retrieved: 2026-10-29
tags: [nuxt-ui, tailwind, theming, tokens]
---

# Nuxt UI 4 design system

Verified 2026-10-29:

- Tailwind v4 is configured CSS-first with `@theme`; there is no
  `tailwind.config.js` in a Nuxt UI 4 project.
- Semantic color aliases (`primary`, `secondary`, `success`, `info`, `warning`,
  `error`, `neutral`) default to green/blue/green/blue/yellow/red/slate.
- Runtime colors are set in `app/app.config.ts`:

```ts
export default defineAppConfig({
  ui: { colors: { primary: 'teal', neutral: 'slate' } }
})
```

- Only colors present in the Tailwind theme may be used; custom colors must be
  declared with `@theme` (all shades 50–950).
- `--ui-text-muted` and `--ui-text-dimmed` are the tokens behind muted text and
  input placeholders; `--ui-primary` is the live primary color variable.
