---
id: field/101-documents
title: שדה — נספח: המסמכים שנדרשים לפי התשובות
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, documents, uploads]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, field/101-credit-items-map]
up: flow/form-101-service
---

# נספח — the documents

The reference form has an empty `appendix` section and instead puts 19 file
fields **inline**, each appearing only when the relevant answer is given. There
are exactly four that are *required*; the rest are optional in the reference but
the printed form says "מצורף", so an employer may insist.

## Derived checklist

| document | required in reference | appears when |
| --- | --- | --- |
| צילום תעודת זהות וספח | no | always (ID holders) |
| צילום דרכון | no | passport holder |
| אישור / רשיון שהייה בישראל | no | passport holder |
| אישור פקיד שומה | no | `מצב משפחתי = פרוד/ה` |
| אישור נכה/עיוור (עובד ו/או בן זוג) | no | item 2 / item 5 |
| אישור תגמול חודשי (נכות) | no | item 2ב ticked |
| טופס 1312א (יישוב מזכה) | no | item 3 |
| תעודת עולה | **yes** | item 4, type = עולה |
| אישור תושב חוזר (משרד הקליטה) | **yes** | item 4, type = תושב חוזר |
| פסק דין מזונות | no | item 10 / item 12 |
| אישור גמלת ילד נכה (מל"ל) | **yes** | item 11 |
| תעודת שחרור / סיום שירות | no | item 14 |
| טופס 119 (הצהרה) | no | item 15 |
| אישור מצה"ל (מילואים כלוחם) | no | item 16 |
| הוכחות לחוסר הכנסה | no | ט׳ reason 1 |
| צילום תלוש שכר (מעסיק אחר) | no | ט׳ reason 2, per row |
| אישור תיאום מס מפק"ש | no | ט׳ reason 3 |

## The v1 decision

Our v1 has **no server**, so "upload" can only mean "attach to the local draft
and embed/zip with the export". Two honest options:

1. **Checklist only** — show each required document as a checkbox the user ticks
   after physically collecting it, and print the list on the output ("יש לצרף
   למעסיק: …"). No upload at all. Zero privacy risk, zero complexity, and the
   user has to hand the originals over anyway.
2. **Local attach** — store images/PDFs in IndexedDB, preview them, and include
   them in the exported package (a zip). Useful for the employer, but doubles
   storage size and creates a "my draft has my ID scan" risk.

Recommended: **(1) in v1**, with the data model ready for (2). Record the decision
in `PLAN.md` / an ADR before building.

## UX

- The checklist must be **derived, never hand-maintained**, and must re-derive
  live when an answer changes (tick item 14 → "תעודת שחרור" appears in the list
  with a highlight animation and a polite announcement).
- Print the checklist **before** the signature page so the user sees what to
  gather before signing.
- Each row: `חובה` / `מומלץ` badge, where it comes from ("בגלל שסימנת סעיף 11"),
  and one line on how to get it (e.g. "מהאזור האישי באתר ביטוח לאומי").
