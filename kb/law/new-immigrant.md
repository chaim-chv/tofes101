---
id: law/new-immigrant
title: עולה חדש — New immigrant credit points (s. 35)
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, credit-points, oleh, aliyah, 2026]
sources: [source/nevo-income-tax-ordinance, source/govil-immigrant-guide, source/kolzchut-oleh]
related: [law/credit-points, law/returning-resident, law/residency-and-foreign-workers, law/credit-points-2026]
up: law/credit-points
---

# עולה חדש — new immigrant

## 1. Who is an “oleh” for s. 35

s. 35(d) defines “עולה” as a person holding:

- an **immigrant visa** or **immigrant certificate** under the Law of Return, or
- a person entitled to such a visa/certificate who holds an **A/1** visa or
  temporary residence permit under the Entry into Israel Law, or
- a **returning resident** (as defined in s. 35(d)), or
- a person in a class the Finance Minister declared to be treated as an oleh.

Excluded: a person whose Israeli citizenship was revoked under s. 10(d) of the
Citizenship Law. Vietnamese refugees are treated as olim by regulation.

For the 101, the practical proof is **תעודת עולה** (immigrant certificate). The
form’s item 4 requires it.

## 2. The credit schedule — olim from 1.1.2022

| Months from aliyah | Monthly fraction | Effective points per month | Annual value at 2,904 ₪/pt |
| --- | --- | --- | --- |
| 1–12 | 1/12 point | **1 point/month** | 2,904 ₪/year |
| 13–30 | 1/4 point | **3 points/month** | 8,712 ₪/year |
| 31–42 | 1/6 point | **2 points/month** | 5,808 ₪/year |
| 43–54 | 1/12 point | **1 point/month** | 2,904 ₪/year |

Total entitlement period: **54 months**. The fractions are of an annual point; the
“effective points per month” column is the intuitive way to show it. The credit is
**additional to** the 2.25 resident base.

## 3. The schedule for olim before 1.1.2022

| Months from aliyah | Monthly fraction | Effective points/month |
| --- | --- | --- |
| 1–18 | 1/4 | 3 |
| 19–30 | 1/6 | 2 |
| 31–42 | 1/12 | 1 |

Total: **42 months**.

## 4. Proration and continuity

1. The credit is given for a tax year that is wholly or partly within the
   54/42-month window, **by the number of months the oleh was in Israel** in that
   year (s. 35(c)).
2. A continuous absence from Israel of **6 months to 3 years** can be excluded
   from the count at the oleh’s request; longer/shorter absences need the
   assessor’s rules.
3. The credit is given **once only** per person.
4. If the aliyah is in December, the first tax year gets one month of credit, not
   a full year.
5. The oleh’s spouse may be included in a joint computation under s. 35(b), with
   the five-times-credit threshold for the non-registered spouse.

## 5. Form 101 item 4

- Checkbox: “אני עולה חדש/ה”.
- “מתאריך ___” — the aliyah date is **mandatory** if the box is ticked.
- Optional: “לא הייתה לי הכנסה בישראל מתחילת שנת המס הנוכחית עד לתאריך ___” —
  this supports the full-year credit / coordination.
- Document: **תעודת עולה** is mandatory per the electronic matrix.
- If the oleh’s entitlement was not continuous because of IDF service, post-
  secondary studies or a trip abroad, the form says to go to the assessor.

## 6. The 2026 temporary exemption (in addition to the points)

The 2026 budget law (חוק עידוד עלייה לישראל וחזרה אליה, הוראת שעה) adds an
**income-tax exemption** for olim and returning residents who arrive between
**5.11.2025 and 31.12.2026**:

| Tax year | Exemption ceiling |
| --- | --- |
| 2026 | 600,000 ₪ |
| 2027 | 1,000,000 ₪ |
| 2028 | 1,000,000 ₪ |
| 2029 | 350,000 ₪ |
| 2030 | 150,000 ₪ |

- Applies to income from work and business produced in Israel.
- Granted over five tax years, 2026–2030.
- **In addition to** the s. 35 points and any other oleh benefit.
- The detailed circular was still pending when the 2026 booklet was updated; the
  operational rules (which income, which taxpayers, how to claim) are `likely`,
  not fully verified. Route users to the Tax Authority’s oleh service.

## 7. Interaction with other tracks

- The oleh points are added to the 2.25 resident base (and 0.5 woman, children,
  etc.).
- A returning resident may be treated as an oleh under s. 35(d) or may have a
  separate track; see [[law/returning-resident]].
- A foreign resident who is not an oleh does not get these points; see
  [[law/residency-and-foreign-workers]].
- The oleh credit applies to **all taxable income**, not only work income; it can
  be used against a pension or business income in the annual return.

## 8. Implementation

1. Store `aliyahDate`; compute months from aliyah to each tax year, not from
   “today”.
2. Compute the monthly fraction based on the month index; do not use a single
   “3 points for 54 months” constant.
3. Prorate by months present in Israel in the tax year; ask for absences only if
   the user wants to exclude them.
4. Require the oleh certificate before allowing the claim.
5. Show the 2026 exemption as a separate track with a “check eligibility” link,
   not as credit points.
6. Do not apply the oleh points to a non-resident/foreign worker who is not an
   oleh.

## 9. What could not be verified

- The exact implementation circular for the 2026 temporary exemption.
- The treatment of a returning resident who does not meet the s. 35(d) definition
  but meets a newer returning-resident track — see [[law/returning-resident]].
