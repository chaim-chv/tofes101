---
id: field/101-credit-items-map
title: שדה — חלק ח׳ מפת 16 פריטי הפטור/זיכוי (UI ↔ rule ↔ document)
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, credit-points, exemptions, documents]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, law/credit-points, law/form-101-section-map]
up: flow/form-101-service
---

# חלק ח׳ — the 16 items

The legal content of each item lives in `kb/law/credit-points*.md`. This node is
the **implementation map**: which control, what it opens, which document it
demands, and which other answers can disable it.

## Gate

The whole section is **blocked** when the employee declared other income *and*
said they already use credit points/brackets against it:

```
visible when !(otherIncomes.hasIncomes && otherIncomes.utilizeTaxCreditsElsewhere)
```
with an explanation panel instead. Keep the reason visible — a section that just
disappears is the reference's worst UX moment.

## Map

| # | label (as on the form) | control | opens | document |
| --- | --- | --- | --- | --- |
| 1 | אני תושב/ת ישראל | read-only mirror of `ilResident` | — | — |
| 2 | נכה 100 % / עיוור/ת לצמיתות | checkbox | certificate + 2ב monthly stipend checkbox | אישור משרד הביטחון/האוצר/פ"ש/תעודת עיוור אחרי 1.1.94; אישור תגמול חודשי |
| 3 | תושב/ת ישוב מזכה | checkbox | from-date + locality select | טופס 1312א |
| 4 | עולה חדש/ה / תושב/ת חוזר/ת | checkbox | type radio (immigrant / returning), from-date, "no income in Israel until" | תעודת עולה (**required** for oleh) / אישור משרד הקליטה (**required** for returning) |
| 5 | בן/בת זוג המתגורר/ת עימי ואין לו/לה הכנסות | checkbox | certificate | אישור נכה/עיוור בגין העובד ו/או בן הזוג |
| 6 | הורה במשפחה חד־הורית החי בנפרד | checkbox | — | — |
| 7 | בגין ילדיי שבחזקתי (חלק ג׳) | checkbox | age-band counters (born this year / 1–2 / 3 / 4–5 / 6–17 / 18) | — |
| 8 | בגין ילדיי ("toddlers" second block) | checkbox | age-band counters (no 18 band) | — |
| 9 | הורה יחיד לילדיי שבחזקתי | checkbox | — | — |
| 10 | ילדים שאינם בחזקתי ואני משתתף/ת בכלכלתם | checkbox | — | צילום פסק דין מזונות |
| 11 | הורה לילד/ה עם מוגבלות < 19 המקבל גמלת ילד נכה | checkbox | count | אישור גמלת ילד נכה מהמל"ל לשנה הנוכחית (**required**) |
| 12 | מזונות לבן/בת זוג לשעבר | checkbox | — | צילום פסק דין מזונות |
| 13 | מלאו לי/לבן זוגי 16–18 בשנת המס | checkbox | — | — |
| 14 | חייל/ת משוחרר/ת / שירות לאומי | checkbox | service start + end dates | תעודת שחרור / סיום שירות |
| 15 | סיום תואר / התמחות / לימודי מקצוע | checkbox | — | הצהרה בטופס 119 |
| 16 | לוחם/לוחמת מילואים בשנה הקודמת | checkbox | number of reserve days | אישור מצה"ל על זכאות |

## Behavioural rules extracted from the reference

- Items 7/8 have a collapsible **legacy** sub-block with the old age bands
  (6–12 / 13–17 / 1–5). It exists only to open old data; do not show it to new
  users, but keep the importer tolerant.
- Item 2 shows a warning when the user did **not** declare "no other income":
  they must go through a tax-coordination approval and attach it in ט.
- Item 4 requires a document to be uploaded (the only two `required` uploads in
  the whole form, together with item 11).
- Several items are mutually fine but *logically* duplicate: 6 vs 9 (single
  parent vs new-family single parent) and 7 vs 8 (two child blocks). The
  reference does not prevent ticking both. We should: show a "בחרת שני מסלולים
  לאותו זיכוי — בדוק/י" warning and link to [law/credit-points](../law/credit-points.md).

## What we build

- A **checklist**, not 16 accordions: one screen listing all 16 with a state
  (`לא רלוונטי` / `רלוונטי` / `נבחר`), so a user can scan and answer "no" fast.
  Each selected item expands **in place** with its documents and sub-questions.
- Each item shows three things: the legal name, a one-sentence plain-Hebrew
  meaning, and "מה צריך לצרף" as a chip list.
- Blocked items are shown disabled with the reason, never hidden.
- A running "summary of claims" that the user can read before signing
  ("אתה מבקש: נקודות זיכוי בגין 2 ילדים; פטור לעולה חדש…").

## Testing

- Snapshot test: every item's visibility, blocking condition, and required
  documents for the 6 canonical profiles (single, married+working spouse,
  married+non-working spouse, new immigrant, separated parent, discharged
  soldier).
- Property test: toggling any answer twice returns the exact same claim set and
  never loses an uploaded document.
