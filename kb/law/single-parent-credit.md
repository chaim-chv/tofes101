---
id: law/single-parent-credit
title: הורה במשפחה חד־הורית / הורה יחיד — Single-parent credit
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, credit-points, single-parent, divorce, custody]
sources: [source/nevo-income-tax-ordinance, source/govil-parents-credit-points, source/kolzchut-children-credit]
related: [law/children-credit-points, law/children-details, law/alimony-credit, law/form-101-section-map]
up: law/credit-points
---

# Single-parent credit

## 1. Two different +1 points — do not stack them

| Form item | Hebrew | Legal basis | Who | Amount |
| --- | --- | --- | --- | --- |
| ח 6 | אני הורה במשפחה חד הורית החי בנפרד | s. 40(b)(1)–(2) | single/divorced/widowed/separated parent living apart, children in custody, receiving NII child allowance, no shared household | **+1 point** |
| ח 9 | אני הורה יחיד לילדי שבחזקתי | s. 40(b)(1ב) | parent whose other parent is **dead** or **absent from the population registry** | **+1 point** |
| ח 10 | בגין ילדי שאינם בחזקתי ואני משתתף בכלכלתם | s. 40(b)(2) | non-custodial parent paying support / sharing costs | **1 point or part**, by share |

Items 6 and 9 are **alternatives**, not cumulative. A parent whose ex-spouse is
alive and registered does not qualify for item 9. A widow/widower or a parent of a
child whose father is not registered may qualify for item 9 (and also has the
“הורה יחיד” definition in the form notes (12)).

## 2. Item 6 — “single-parent family living apart”

Conditions, cumulative:

1. Marital status is **single, divorced, widowed, or separated**. “Separated”
   (פרוד/ה) requires the assessor’s written approval — the form itself says
   “חובה לצרף אישור פ״ש” next to the option.
2. The children are **in the employee’s custody** and listed in section ג.
3. The employee receives the **NII child allowance** for them.
4. The employee does **not** manage a joint household with another person.
5. The employee is not entitled to the dependent-spouse point under s. 37.

Effect: +1 point, in addition to the per-child points, regardless of the number of
children.

## 3. Item 9 — “הורה יחיד”

Definition (form notes (12); s. 40(b)(3)): a single-parent family with a child
under 19 in the tax year, where **the other parent died** or **the child is
registered in the population registry without the other parent’s details**.

Effect: +1 point, in addition to the per-child points, once (not per child). The
statute also provides that this parent gets the father’s parallel points under
s. 40(b)(1א) in addition to the mother’s schedule — the practical result is the
full single-parent schedule; do not double-count the per-child table and the +1.

## 4. Item 10 — non-custodial parent

- The parent who is **not** entitled to the per-child points under item 7 may get
  **1 point or a fraction** if the parents share the children’s upkeep
  (s. 40(b)(2)).
- The fraction is based on the parent’s share of the costs; the form asks for a
  divorce judgment / support judgment.
- This is separate from the **alimony to a former spouse** point (s. 40א), which
  applies only after remarriage and is claimed under item 12.

## 5. Part-year eligibility

- A parent who becomes single (divorce, death, separation) during the year gets
  the +1 **pro rata by months** of eligibility; the same applies if they remarry
  during the year.
- The per-child points are annual and not prorated by the month of birth.
- Example: divorced on 1 July → 6/12 of the +1 = 0.5 for that year; full 1 point
  in the following year. This mirrors the s. 41 part-year rule.

## 6. Remarriage

- The parent who receives the NII child allowance **loses** item 6 on remarriage
  (the new spouse’s income/household changes the unit).
- The non-custodial parent who pays support may **continue** item 10 while paying,
  even after remarriage.
- Alimony to the former spouse (item 12) starts in the year of remarriage and is
  a separate +1.

## 7. Interaction with the children table

- Item 6/9 adds to the per-child points, it does not replace them.
- Item 7 (mother/custodial) is the per-child schedule; item 8 (father/non-custodial)
  is the other parent’s schedule.
- A single parent who is the father uses item 8 for the per-child points and item
  9 for the +1 if the other parent is dead/absent; item 6 is for the parent living
  apart with custody and receiving the allowance.

## 8. Implementation

1. Do not let the user tick 6 and 9 simultaneously; show an explanation and
   require choosing the correct one.
2. If 6 is ticked, require at least one child in custody + NII allowance; if 9 is
   ticked, require at least one child and a “other parent dead/unknown” assertion.
3. If 10 is ticked, require a child **not** in custody and a support judgment;
   allow a fraction (0–1) only if the judgment shows shared costs.
4. If marital status = “פרוד/ה”, require the assessor approval upload before the
   form can be completed.
5. Do not allow item 6/9 if the employee ticked item 5 (dependent spouse); the
   statute excludes it.
6. Show the monthly value of the +1 (242 ₪) but label it as part of the estimate.

## 9. What could not be verified

The exact interaction between item 9 and the father’s parallel points under
s. 40(b)(1א) is statutory but not spelled out in the 2026 circular’s field notes;
the practical reading above (full schedule + one +1) follows the statute and the
Tax Authority table. For a disputed case, route to the assessor.

## Sources

- [[source/nevo-income-tax-ordinance]]
- [[source/govil-parents-credit-points]]
- [[source/kolzchut-children-credit]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
