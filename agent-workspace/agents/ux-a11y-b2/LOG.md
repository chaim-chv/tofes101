# ux-a11y-b2 — private log

Scope: `kb/ux/**`, source nodes for cited standards, one `## UX` append to `kb/index.md`.

## 2026-10-29 — research

Search engines were blocked (418 / Netfree). Worked from known URLs + `r.jina.ai`
reader; gov.il and w3.org return Cloudflare 403 to curl but 200 via reader/webfetch.
`browser.*` unavailable (no desktop browser) — did not use.

Primary finds:
- gov.il hosts the full **IS 5568 part 1 (Sept 2023)** PDF. Its foreword says it is
  identical to **WCAG 2.0 (2008)** except national additions, and it replaced the
  May 2021 edition. → law target is 2.0 AA, not 2.2.
- Full consolidated Service Accessibility Regulations on Wikisource (linked from
  the gov.il guide). Clause numbers are partly lost in the conversion; reconstructed
  from cross-references (35ה → 34, 91(ה); 35ב → 35ג). Flagged in the source node.
- 35ב(ג)(2): data-entry forms for a service must comply even if created before
  26.10.2015 → form 101 is explicitly in scope.
- 35ה: statement in a prominent place, accommodations + coordinator + complaint
  channel. 35ו(ז): ≤ ₪100k turnover / עוסק פטור exemption.
- Coordinator: 25+ employees, publish name/office/contact (91(א),(ה)).
- GOV.UK question-pages/error-summary/names/addresses/dates confirmed via 200.
- W3C bidi articles (structural + inline) are the backbone of the RTL nodes.

## Decisions taken (UX)

1. **Wizard of 8 steps + review**, not the reference's single long page.
   Rationale in `ux/wizard-vs-long-page`.
2. **No global modifier shortcuts by default.** `Ctrl+Alt` = VoiceOver `VO`;
   `Insert`/`CapsLock` = NVDA/JAWS. Power keys are an opt-in single-key layer,
   inactive while typing. `ux/keyboard-model` + `checklists/keyboard-map`.
3. **Mark optional, not required** ("(רשות)"), required is the default.
4. **ID/phone = `type=text` + `inputmode`**, never `type=number`.
5. **Signature = drawing + typed-name path**, both equal; canvas `role="img"`.
6. **Draft = localStorage + JSON file export**, no cross-device link (no server).

## Open / unverified

- Whether our operator is a "חייב" under the regulations (turnover, commercial
  model) — legal question, `confidence: likely`, needs a `decision/`.
- Exact clause numbers for the exemption subsections (35ו vs neighbours) — see
  numbering note in the source node.
- Israeli ID check-digit algorithm and phone formats: practice-accurate, not
  verified against a formal standard → `likely`.
- Tagged-PDF support of browser print / pdf-lib → not tested; do not claim part 2
  conformance until tested with PAC/Adobe.
- Hebrew "plain language" has no single binding standard; used gov.il's own
  statement + GOV.UK/NN/g practice → `likely`.
- `?` help key: only in opt-in mode; WCAG 2.1.4 satisfied by off-by-default +
  remap/toggle.

## Files

30 nodes under `kb/ux` (27 + 3 checklists), 17 source nodes, `## UX` section in
`kb/index.md`. `bun run kb:check` clean for all ux/source nodes (other domains
still have their own broken links at time of writing).
