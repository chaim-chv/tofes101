---
id: law/form-101-official-pdf
title: טופס 101 הרשמי — המסמך, הגרסה והקריאה הנכונה שלו
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, form-101, pdf, artifact, versioning]
sources: [source/taxes-form-101-2026, source/taxes-electronic-101-rules-2026]
related: [law/form-101, law/form-101-section-map, law/declaration-and-signature]
up: law/form-101
---

# The official artifact

## 1. Identity card of the document

| Property | Value |
| --- | --- |
| Title | כרטיס עובד ובקשה להקלה ולתיאום מס על ידי המעסיק |
| Form code | **0101/130** |
| Revision | **11.2025** (header: “מעודכן ל־11.2025”) |
| Tax year | blank field; the same artifact is used for 2026 |
| Pages | 2 (page 1 = sections א–ז; page 2 = ח–י + explanatory notes) |
| Format | vector PDF, no AcroForm fields, embedded fonts |
| Size / SHA-256 | 553,528 bytes / `bf4f11b0228c30bf73b0c132475c0b8fb6b1e908ef70411c0fec5474f9d7d633` |
| Local copy | `research/raw/law/official-101.pdf` (byte-identical to the tofes101.co.il asset) |

Primary URL used: <https://tofes101.co.il/assets/forms/tofes-101.pdf>. The Tax
Authority’s own service page currently links a 2024 copy
(`Service_Pages_Income_tax_annual-report-2024_itc101.pdf`); the 2026 content is
governed by the 12.1.2026 circular. A pensioner-specific short version, **101ג**,
exists separately and is not this artifact.

## 2. Page 1 — the form

Read top-to-bottom, right-to-left:

1. **Header** — form code, revision, “1 מתוך 2”, tax-year box, the sentence that
   the form is filled at the start of work and at the start of every tax year
   (unless the Director approved otherwise), and that changes must be declared
   within a week.
2. **א. פרטי המעסיק** — a single row: name / address / phone / deduction-file no.
3. **ב. פרטי העובד/ת** — three visual rows:
   - identity: “has ID?” + ID number or passport number, surname, first name,
     birth date, aliyah date;
   - address: street/neighbourhood, house no., city, postcode; e-mail; phone;
     mobile;
   - status: gender, marital status, Israeli resident, kibbutz member, health
     fund.
4. **ג. פרטי ילדיי** — a 6-column table (name, ID, birth date, col. 1 custody,
   col. 2 NII allowance), with 5 blank rows.
5. **ד. הכנסותיי ממעסיק זה** — six checkboxes + start-date box. The explanatory
   notes across the page define each salary type and the withholding consequence.
6. **ה. הכנסות אחרות** — “no other income” vs “other income”, six type boxes,
   items 7/8 (where credits are used), 9/10 (training fund / pension of the other
   income).
7. **ו. בן/בת הזוג** — identity + income yes/no + work/pension/business vs other.
8. **ז. שינויים במהלך השנה** — three rows: date of change, date of notice,
   employee signature.

## 3. Page 2 — claims, coordination, declaration

1. **ח. פטור או זיכוי** — 16 numbered items (1, 2א, 2ב, 3–16), each a checkbox
   with a short legal description and a document list.
2. **ט. תיאום מס** — three mutually exclusive reasons; item 2 opens a 6-column
   repeat table (employer, address, deduction file, income type, monthly income,
   tax withheld).
3. **י. הצהרה** — date + signature. The declaration text is the legal
   representation; it is **not** a privacy consent.
4. **דברי הסבר למילוי טופס 101** — notes (1)–(14), the authoritative definitions:
   - (1) עובד / מעסיק / משכורת / מלגה / עבודה;
   - (2) משכורת חודש = ≥ 18 days/month;
   - (3) משרה נוספת = > 5 h/day **on top of** another salary or taxable pension;
     the employee chooses which job is “additional”;
   - (4) משכורת חלקית = ≤ 5 h/day, or > 5 h/day but < 8 h/week; max withholding
     unless it is the only income;
   - (5) שכר עבודה (עובד יומי) = < 18 days/month but ≥ 8 h/week; daily table
     unless it is the only income;
   - (6) קצבה — do not report a NII-exempt pension or a wholly exempt survivors’
     pension;
   - (7)/(8) — if the employee does/doesn’t fill the box, the employer is barred
     from the ordinary table and must withhold at the maximum rate;
   - (9)/(10) — training-fund / pension contributions of other income are added to
     this payroll unless the box is ticked;
   - (11) single-parent family = single, divorced, widowed, separated (separation
     only with assessor approval);
   - (12) “הורה יחיד” = single parent whose other parent died or is absent from the
     population registry;
   - (13) “ישוב מזכה” = a locality under s. 11 of the Ordinance or s. 11 of the
     Absorption of Discharged Soldiers Law;
   - (14) box 2ב may be ticked only if 2א is ticked — that is the only way to get
     the higher exemption ceiling.

## 4. How to read the PDF mechanically (and why not to)

The text layer is RTL and fragments numbers/letters across runs. `pypdf` gives a
usable dump (`research/raw/law/extracted/tofes-101-tofes101.txt`) but columns
interleave. For field labels and order, use the rendered page images
(`tofes101-p1.png`, `tofes101-p2.png`) or the section map; for values, use the
electronic matrix, which is tabular and machine-readable.

## 5. Version pitfalls

- **2024 vs 2026**: the 2024 form lacks item 16 (reserve combatants) and has
  slightly different wording; do not use it as the 2026 schema.
- **101 vs 101ג**: 101ג is the shortened pensioner form; 101 is the general form.
- **Paper vs electronic**: the paper form has no employer signature; the approved
  electronic version requires employee identification, a declaration tick, and an
  employer e-signature on a locked PDF. A browser-generated PDF is a paper-form
  equivalent, not an approved electronic 101.
- **Revision within a year**: always display the revision date and the tax year;
  never silently substitute a newer revision for an old year.

## 6. What could not be verified

The gov.il service page’s linked PDF is the 2024 revision, and the 2026 official
blank form was retrieved from the tofes101.co.il mirror. It matches the 2026
circular’s field list and the 2024 Tax Authority PDF layout, but a direct
`taxes.gov.il` 2026 blank-form URL was not found. Treat the mirror as a faithful
copy of the official artifact, not as the Tax Authority’s canonical URL.
