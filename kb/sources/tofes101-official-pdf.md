---
id: source/tofes101-official-pdf
title: טופס 101 הרשמי (PDF) + דברי ההסבר
type: source
confidence: verified
authority: primary
publisher: רשות המסים / tofes101.co.il asset mirror
url: https://tofes101.co.il/assets/forms/tofes-101.pdf
retrieved: 2026-10-29
status: verified
tags: [source, official-form, pdf]
---

# The official blank form 101

2-page vector PDF, 553 KB, embedded fonts, no images, **no AcroForm fields**.
Header note: "מעודכן לטופס 10/2025, ר"י אגף בכיר טכנולוגיות דיגיטליות ומידע".

- **Page 1** — the form itself: sections א–ז (employer, employee, children,
  income from this employer, other income, spouse, changes). Checkbox glyphs
  (`o`, `q`) and the section titles are in the text layer.
- **Page 2** — sections ח–י (the 16 exemption/credit items, tax coordination
  table, declaration + signature) **and the official explanatory notes**
  "דברי הסבר למילוי טופס 101", numbered (1)–(14), which define:
  - עובד / מעסיק / משכורת / מלגה / עבודה
  - משכורת חודש (≥ 18 days/month), משרה נוספת (> 5 h/day on top of other
    taxable income), משכורת חלקית (< 5 h/day, or > 5 h but < 8 h/week),
    שכר עבודה (עובד יומי, < 18 days), קצבה, מלגה — **and the withholding
    consequence of each** (partial/monthly → maximum rate unless it is the only
    income)
  - the consequences of *not* filling boxes 7/8/9/10 of section ה
  - definitions of הורה במשפחה חד הורית, הורה יחיד, ישוב מזכה
  - "עובד ימלא משבצת זו בסעיף א' 2 ורק כך יהיה זכאי לתקרת הפטור הגבוהה"

**Local copies:** `research/raw/law/official-101.pdf`,
`research/raw/law/official-101.txt` (text, `pypdf`).

**What it establishes:** the canonical section order, labels, checkbox semantics
and the definitions that every help text in our UI must agree with. Where the
reference implementation and this PDF disagree, **this PDF wins**, and the
disagreement should be recorded in `kb/competitor/feature-parity.md`.

⚠️ The text layer is RTL and fragments numbers/letters across runs. It is good
enough to read and quote, not to parse mechanically. Page 2's notes are the most
reliably extracted part.
