---
id: law/residency-and-foreign-workers
title: תושבות ועובדים זרים — Residency, foreign residents and foreign workers
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, residency, foreign-worker, credit-points, form-101]
sources: [source/nevo-income-tax-ordinance, source/kolzchut-foreign-worker, source/wikisource-payroll-withholding-regulations]
related: [law/credit-points, law/who-must-file, law/new-immigrant, law/form-101-section-map]
up: law/form-101
---

# Residency and foreign workers

## 1. The resident test

- “תושב ישראל” is not defined by citizenship; it is a factual test of center of
  life (s. 1 of the Ordinance). The 101 asks a simple yes/no; the employer is not
  expected to adjudicate a borderline case.
- A resident gets the **2.25** base (2 + 0.25 travel), the woman’s 0.5, and the
  personal/family credits.
- A **non-resident** does not get the 2.25 or the personal credits. Withholding is
  per the assessor’s instructions / the foreign-resident rules.
- If the employee is a resident but spends part of the year abroad, the credits are
  generally annual; special treaty/foreign-income rules apply outside the 101.

## 2. Foreign worker (עובד זר)

A foreign worker is a non-Israeli employee working in Israel under a permit. The
rules differ from a “foreign resident” who happens to work in Israel.

1. **Form 101 is not mandatory** for a foreign worker: regulation 2(a) excludes
   “עובד זר” from the employee duty, and regulation 2(c) excludes them from the
   employer’s demand duty.
2. Withholding:
   - foreign resident → תוספת ג׳ (regulation 3(d)(1)); the assessor may give
     instructions;
   - foreign worker who is an Israeli resident → תוספת א׳/ב׳ (regulation 3(d)(2)).
3. Credit points (from 2018, per the foreign-worker regulations):
   - nursing care sector: **2.25 points**;
   - other sectors: **1 point**;
   - foreign **women**: **+0.5 point** in every sector;
   - asylum seekers with a 2A5 temporary permit: **no points**;
   - part-year: points prorated by months in Israel.
4. Documents: passport + visa/residence permit (the 101 supports a passport-only
   identity); no Israeli ID, so the electronic matrix hides the Israeli-resident,
   child and credit sections.

## 3. “Foreign resident” vs “foreign worker”

| Term | Meaning | 101 |
| --- | --- | --- |
| תושב חוץ | non-resident for tax purposes | may file; no 2.25; withholding per assessor/תוספת ג׳ |
| עובד זר | foreign worker under a work permit | 101 not mandatory; special point regime; passport path |
| תושב ישראל | Israeli tax resident | full 101; 2.25 base |
| עולה | new immigrant / returning resident under s. 35 | 101 item 4; oleh points |

## 4. What the employer should do

1. Ask for an Israeli ID first; if none, passport + visa/residence permit.
2. Do not apply the 2.25 resident points to a non-resident.
3. For a foreign worker, apply the foreign-worker point table only if the employer
   has the permit/sector evidence; otherwise withhold per the assessor.
4. Keep copies of the passport/visa with the 101 (or the foreign-worker file).
5. If the worker’s status changes (becomes a resident, gets an Israeli ID), a new
   101/update is required.

## 5. Implementation

1. Section ב identity type: ID vs passport; if passport, hide the ID-only sections
   and the 2.25 claim.
2. Add a “residency status” selector: Israeli resident / foreign resident /
   foreign worker (nursing / other) / asylum seeker 2A5.
3. Compute foreign-worker points only when the status is explicit and the sector
   is known; otherwise show “assessor instructions required”.
4. Do not treat “has no Israeli ID” as “not a resident” automatically — a new
   immigrant may have an A/1 visa and a תעודת עולה but no ID yet.
5. Year-stamp the foreign-worker point table.

## 6. Unverified

- The exact current foreign-worker regulation citation and whether the 2.25/1/0.5
  table changed after 2018.
- The treatment of Palestinian workers from the territories (different regime,
  often no 101; assessor instructions).
- Treaty residents (e.g. foreign experts) and the 101’s role, if any.
- Special exemptions sometimes mentioned in payroll guides (sailors, foreign experts, etc.) are outside the 101’s checkboxes; route them to the assessor rather than inventing a field.

## Sources

- [[source/nevo-income-tax-ordinance]]
- [[source/kolzchut-foreign-worker]]
- [[source/wikisource-payroll-withholding-regulations]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
