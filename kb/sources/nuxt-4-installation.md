---
id: source/nuxt-4-installation
title: Nuxt 4 — Installation (official docs)
type: source
status: verified
confidence: verified
updated: 2026-10-29
publisher: Nuxt (nuxt.com)
url: https://nuxt.com/docs/4.x/getting-started/installation
retrieved: 2026-10-29
tags: [nuxt, tooling, scaffolding]
---

# Nuxt 4 installation

Verified 2026-10-29 against the 4.x docs:

- Prerequisite: Node.js **22.x or newer** (active LTS recommended). The published
  `nuxt@4.6.3` `engines` field is `^22.22.3 || ^24.15.0 || >=26.0.0`.
- Create a project with `bun create nuxt@latest <name>` (the docs list npm, yarn,
  pnpm, bun and deno variants). The `create-nuxt` package resolved to **4.0.1**.
- `bun run dev`; use `bun --bun run dev` to run the dev server on the Bun runtime.
- Docs recommend VS Code + Vue (Volar) and note that `npm create nuxt@latest -t ui`
  is the Nuxt UI starter template.

The docs do **not** mention `nuxi init` as the current command; `nuxi` is now the
same 4.0.1 CLI package, so `bunx nuxi@latest init` still resolves, but
`bun create nuxt@latest` is the documented path.
