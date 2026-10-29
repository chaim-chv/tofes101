---
id: law/children-details
title: פרטי הילדים — Section ג: child rows, custody and child allowance
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, children, form-101, custody, validation]
sources: [source/tofes101-official-pdf, source/taxes-electronic-101-rules-2026]
related: [law/children-credit-points, law/single-parent-credit, law/id-number-validation, law/form-101-section-map]
up: law/form-101
---

# Section ג — children

## 1. What the form collects

For each child **under 19 in the tax year**:

| Column | Hebrew | Type | Rule |
| --- | --- | --- | --- |
| name | שם הילד | text | required if the row is used |
| ID | מספר זהות | 9 digits | required if the row is used; same check digit as the employee |
| birth date | תאריך לידה | date | required if the row is used; must be in the past and consistent with “under 19” |
| 1 | הילד נמצא בחזקתי | checkbox | only enabled after name + ID + birth date are complete |
| 2 | אני מקבל/ת בגינו קצבת ילדים מב״ל | checkbox | only enabled after column 1 |

The row is **all-or-nothing**: if any of name/ID/birth date is entered, all three
are required. Empty rows are allowed; the section is optional.

## 2. Age rule

- The child must be **under 19 at the end of the tax year** (31 December).
- A child who turns 19 during the year is not listed.
- The age bands for the credit are computed from the birth date and the tax year;
  see [[law/children-credit-points]].
- Do not use “today’s age”; use the tax year.

## 3. Custody and child allowance

- Column 1 (“in my custody”) determines whether the child belongs to the mother/
  custodial track (item 7) or the father/non-custodial track (item 8).
- Column 2 (“I receive NII child allowance”) is evidence for the single-parent
  item 6 and for the custody arrangement. It is not the tax credit itself.
- The form does not ask for the other parent’s ID, the allowance amount, or the
  custody agreement; the employer may ask for the ספח/approvals separately.
- A child can be in the custody of one parent and still generate the non-custodial
  parent’s item 10 if that parent pays support.

## 4. Duplicates and errors

1. The same child ID must not appear twice.
2. A child ID that fails the check digit should be rejected with a clear error, not
   silently corrected.
3. A birth date that makes the child 19+ in the tax year should be rejected from
   section ג (but may still be relevant for s. 45 adult-child credit outside the
   101).
4. A child with no Israeli ID (foreign/undocumented) is an edge case: the form is
   ID-based; route to the assessor rather than inventing a number.
5. If the employee has no Israeli ID, the 2026 electronic matrix hides section ג;
   the passport path does not support child credits.

## 5. Privacy

- Children’s IDs and birth dates are personal data of minors; collect only what the
  form requires, mask the ID in the UI, do not log it, and do not send it to
  analytics.
- The employer must retain the child data only as part of the 101 record and for
  the retention period; see [[law/privacy-consent]] and [[law/retention]].

## 6. Implementation

1. Render a repeatable table with add/remove rows; start with one optional row.
2. Validate each row atomically; show errors at the row and in the error summary.
3. Derive the age band and display it (“גיל בשנת המס: 8 — 2 נקודות לאם / 1 לאב”)
   only as help, not as a binding calculation.
4. Gate the custody checkbox on a complete row; gate the allowance checkbox on
   custody.
5. Cross-check the item 7/8 counters against the number of rows in each custody
   group; warn on mismatch.
6. Do not require section ג to be complete to submit; it is optional.
7. If the user has no children, let them skip without a red error.

## Sources

- [[source/tofes101-official-pdf]]
- [[source/taxes-electronic-101-rules-2026]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
