---
id: source/tepez-runner-bundle
title: tepez form-runner front-end bundle (forms.tofes101.co.il)
type: source
confidence: verified
authority: secondary
publisher: Tepez Ltd
url: https://forms.tofes101.co.il/assets/js/tepez-front-core-838c548d67.js
retrieved: 2026-10-29
status: verified
tags: [source, reference-implementation, bundle]
---

# The runner application

`https://forms.tofes101.co.il/f/5a704edf239da27488a8cd9c` loads:

| asset | what it tells us |
| --- | --- |
| `assets/js/tepez-front-core-*.js` (786 KB) | AngularJS app; form model, relevance/equation evaluation, validators, "render" actions |
| `assets/js/vendors~tepez-front-core-*.js` (2.3 MB) | AngularJS, lodash, etc. |
| `assets/js/dexie-*.js` (254 KB) | IndexedDB — the runner persists drafts locally |
| `assets/js/pdf-*.js` (619 KB) | pdf.js (preview, not generation) |
| `assets/js/ckeditor-*.js` (614 KB) | rich-text for builder fields |

**What it establishes:** the reference implementation is a *generic* form builder
runtime, not a bespoke 101 app; the domain lives entirely in the form JSON
([source/tofes101-form-runner-api](./tofes101-form-runner-api.md)). It also shows
the features the runtime has to support: save/submit action chains, "render"
(PDF) actions, email actions, templates, per-entry status
(`created / saved / submitted / deleted / template / render`).

**Status:** 200 for each asset at retrieval. Saved locally during recon under
`/tmp/run/` (ephemeral; re-fetch with curl if needed). Vendor help strings inside
the bundle are the source of the feature names quoted in
[finding/tepez-form-runtime](../finding/tepez-form-runtime.md).
