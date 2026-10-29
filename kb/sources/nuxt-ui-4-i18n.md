---
id: source/nuxt-ui-4-i18n
title: Nuxt UI 4 — Internationalization, locale and RTL direction
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: Nuxt UI (ui.nuxt.com)
url: https://ui.nuxt.com/docs/getting-started/integrations/i18n/nuxt
retrieved: 2026-10-29
tags: [nuxt-ui, i18n, rtl, hebrew]
---

# Nuxt UI 4 i18n and RTL

Verified 2026-10-29:

- `UApp` takes a `locale` prop; locales come from `@nuxt/ui/locale`
  (e.g. `import { he } from '@nuxt/ui/locale'`). Each locale carries a `code`
  used for date/time formatting in Calendar, InputDate and InputTime.
- Every locale has a `dir` property; `UApp` uses it to set the directionality of
  its components.
- With `@nuxtjs/i18n` installed, `UApp` follows the active locale automatically
  (**4.12+**) and only bundles the matching Nuxt UI locales.
- For a multilingual app, set `lang`/`dir` on `<html>` yourself with
  `useLocaleHead()` (or declare `dir` on each locale), e.g.:

```ts
i18n: {
  locales: [{ code: 'he', language: 'he', dir: 'rtl', name: 'עברית' }]
}
```

- The docs' supported-language list is on the website; the `he` export was
  confirmed by importing it in the spike.

Note: Nuxt UI's `dir` attribute does not replace document-level
`<html dir="rtl">`; the spike sets it in `app.head.htmlAttrs`.
