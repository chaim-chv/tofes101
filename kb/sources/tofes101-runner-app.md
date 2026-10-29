---
id: source/tofes101-runner-app
title: forms.tofes101.co.il — the embedded runner shell
type: source
status: verified
confidence: verified
authority: secondary
publisher: Tepez Ltd (forms.tofes101.co.il)
url: https://forms.tofes101.co.il/f/5a704edf239da27488a8cd9c
retrieved: 2026-10-29
tags: [source, competitor, tech, runner]
---

# `GET /f/<formId>?data=<json>`

**Status:** 200, 2.9 KB HTML shell, no SSR content.

**What it establishes:** the runner is **AngularJS 1.x** — `<html ng-controller="tpCtrl"
ng-app="tepez" ng-strict-di>`, `<div id="tp-angular-root" ui-view>` (ui-router), plus a
`#tp-pre-angular-overlay` shown while the app boots. Scripts, in order: `dexie` (IndexedDB
for local drafts/offline), `pdf`, `ckeditor`, `vendors~tepez-front-core`,
`tepez-front-core`. Stylesheet `assets/themes/bs3/core-bs3-rtl` (Bootstrap 3, RTL),
select2 for the city/street pickers, Font Awesome 4.7.

`?data=` is a JSON blob; on the 101 submit page it is
`{"seo":{"sourceType":"direct-other","landingUrl":…,"parentUrl":…,"capturedAt":…}}` —
i.e. campaign/attribution context is passed into the iframe.

**Local copies:** `research/raw/site/app-shell.html`.
**Nodes:** [competitor/tech-recon](../competitor/tech-recon.md),
[finding/tepez-form-runtime](../finding/tepez-form-runtime.md).
