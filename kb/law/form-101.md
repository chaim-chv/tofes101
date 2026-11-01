---
id: law/form-101
title: טופס 101 — כרטיס עובד: הסגל המשפטי
type: concept
status: verified
confidence: verified
updated: 2026-11-01
tags: [law, form-101, income-tax, payroll, israel]
sources: [source/tofes101-official-pdf, source/taxes-electronic-101-rules-2026, source/wikisource-payroll-withholding-regulations, source/nevo-income-tax-ordinance]
related: [law/form-101-section-map, law/credit-points, law/tax-coordination, law/employer-obligations, law/privacy-consent]
---

# טופס 101 — כרטיס עובד

> **One sentence:** Form 101 is the employee’s annual declaration to the employer
> that tells the payroll which tax credits, exemptions and coordination to apply;
> the employer is legally required to demand it and to withhold tax at the maximum
> rate if it is missing or invalid.

This is the root of the legal graph. Implementers should read it, then
[[law/form-101-section-map]], then the specific rule node for each checkbox.

## 1. What it is — and what it is not

1. The official name is **“כרטיס עובד ובקשה להקלה ולתיאום מס על ידי המעסיק”**,
   form code **0101/130** (current revision 11.2025) — see
   [[law/form-101-official-pdf]].
2. It is **not a statute**. The binding instrument is the Income Tax Ordinance
   (פקודת מס הכנסה) plus the **Payroll Withholding Regulations** (תקנות מס הכנסה
   (ניכוי ממשכורת ומשכר עבודה), התשנ״ג-1993). Regulation 2 calls it “כרטיס העובד
   (טופס 0101)” and prescribes when it must be filled
   ([[source/wikisource-payroll-withholding-regulations]]).
3. The employer’s duty to withhold at source comes from **section 164** of the
   Ordinance; section 166 makes the employer report and pay the withheld tax
   ([[source/nevo-income-tax-ordinance]]).
4. The form is therefore **evidence for the employer**: it authorises the payroll
   to apply credits/exemptions and to coordinate tax. It is not a tax return and
   does not replace form 106 (annual statement) or form 116 (coordination
   application).

## 2. Who fills what

| Part | Who fills | What it controls |
| --- | --- | --- |
| א — פרטי המעסיק | employer | name, address, phone, deduction-file number |
| ב — פרטי העובד/ת | employee | identity, address, gender, marital status, residency, health fund, kibbutz |
| ג — ילדים עד 19 | employee | children’s names/IDs/birth dates, custody, NII child allowance |
| ד — הכנסות ממעסיק זה | employee | salary type (monthly / second job / partial / daily / pension / scholarship) and start date |
| ה — הכנסות אחרות | employee | whether other income exists; where credits are used; training-fund/pension flags |
| ו — בן/בת הזוג | employee (only if married) | spouse identity and income |
| ז — שינויים במהלך השנה | employee | date of change, date of notice, signature |
| ח — פטור או זיכוי (16 items) | employee | the actual credits/exemptions |
| ט — תיאום מס | employee (optional) | no prior income / other employers / assessor approval |
| י — הצהרה | employee | truth declaration + undertaking to notify changes within 7 days |

The employer completes part א, verifies attachments, computes the payroll and
retains the form; the employee signs the declaration. In the approved electronic
version the employer also e-signs the locked PDF
([[source/taxes-electronic-101-rules-2026]]).

## 3. When it must be delivered

1. **Within 7 days of starting work, or on the first payday, whichever is earlier**
   — regulation 2(a)(1).
2. **On 1 January of every following tax year** — regulation 2(a)(2).
3. **Within 7 days of any change** in the declared particulars — regulation 2(d).
4. The employer must **demand** it on the same dates — regulation 2(c).

Full detail, including the 2(e) exemption and pensioner instructions:
[[law/submission-deadlines]].

## 4. What happens if it is missing or late

- The employer must withhold **at the maximum rate** (the top 47% bracket) if the
  employee did not fill the form, or did not fill the “other income” section —
  regulation 5(a). A “second job” declaration also triggers maximum withholding
  unless coordination applies.
- The employee can still claim the credits in the annual return / a refund claim
  (up to 6 years), but the monthly cash flow is worse.
- A false declaration is an offence under the Income Tax Ordinance (the
  declaration says so expressly). No specific fixed fine on the employee for mere
  lateness was found; see [[law/edge-cases]] for the caveat.

See [[law/withholding-mechanics]] and [[law/employer-obligations]].

## 5. The 2026 numbers a developer must not hard-code from memory

| Item | 2025 | 2026 |
| --- | --- | --- |
| Credit point | 2,904 ₪/yr · 242 ₪/mo | 2,904 ₪/yr · 242 ₪/mo |
| 10% bracket ends | 84,120 ₪/yr | 84,120 ₪/yr |
| 14% bracket ends | 120,720 ₪/yr | 120,720 ₪/yr |
| 20% bracket ends | 193,800 ₪/yr | **228,000 ₪/yr** |
| 31% bracket ends | 269,280 ₪/yr | **301,200 ₪/yr** |
| 35% bracket ends | 560,280 ₪/yr | 560,280 ₪/yr |
| Surtax | 3% above 721,560 | 3% above 721,560 (+2% capital) |

The 2026 20%/31% thresholds were widened **retroactively to 1.1.2026** by the law
of 31.3.2026 — see [[law/tax-brackets-2026]]. The point value is frozen for
2024–2027 ([[law/credit-point-value]]).

## 6. Section map (summary)

| Section | Hebrew | One-line meaning | Node |
| --- | --- | --- | --- |
| א | פרטי המעסיק | employer identity + deduction file | [[law/employer-obligations]] |
| ב | פרטי העובד/ת | identity, address, status | [[law/marital-status]], [[law/id-number-validation]] |
| ג | ילדים עד 19 | child rows + custody + NII allowance | [[law/children-details]] |
| ד | הכנסות ממעסיק זה | salary type + start date | [[law/withholding-mechanics]] |
| ה | הכנסות אחרות | other income + credit allocation | [[law/tax-coordination]] |
| ו | בן/בת הזוג | spouse identity + income | [[law/spouse-not-working]] |
| ז | שינויים | mid-year change notice | [[law/submission-deadlines]] |
| ח | פטור/זיכוי | 16 credit/exemption items | [[law/credit-points]] |
| ט | תיאום מס | coordination request | [[law/tax-coordination]] |
| י | הצהרה | signature + undertaking | [[law/declaration-and-signature]] |

The exhaustive one-row-per-section/item table is
[[law/form-101-section-map]].

## 7. The credit system in one paragraph

A **credit point** is a fixed annual amount (2,904 ₪ in 2025–2026) subtracted from
the tax otherwise due. It is **not a refundable grant**: unused points cannot
produce a negative tax bill, but they can offset tax on other income in the annual
return and generate a refund of over-withheld tax. The base for an Israeli
resident is **2.25 points** (2 under s. 34 + 0.25 travel under s. 36); a woman
adds 0.5 (s. 36א). On top of that sit children, single-parent, spouse, aliyah,
soldier/reserve, studies, alimony, youth and disability tracks. Start at
[[law/credit-points]]; the 2026 snapshot is [[law/credit-points-2026]].

## 8. Coordination in one paragraph

An employee with two employers, or with income besides this payroll, must decide
**where the credits and brackets are used**. Form 101 section ה declares the other
income and whether the credits are claimed here; section ט asks the employer to
coordinate. If the employee uses the credits elsewhere, this employer withholds at
the maximum rate. For a formal allocation the employee files **form 116** with the
Tax Authority (not form 119 — 119 is the academic/profession credit declaration).
See [[law/tax-coordination]].

## 9. Privacy and signatures

The form contains an ID number, children’s IDs and birth dates, marital status,
health-fund membership and income. The employer is the data controller; the legal
basis is the statutory withholding duty, **not consent**. The employee’s signature
is a truth declaration, not a privacy consent. For a browser-only tool this means:
no server, no analytics of answers, no third-party calls beyond the reviewed
page-view counter (ADR-0008), explicit local-storage warnings.
See [[law/privacy-consent]] and [[law/declaration-and-signature]].

## 10. Year stamping rule

Every numeric rule in this graph is stamped with a tax year. Never apply a 2025
threshold to 2026, and never assume January 2026 law equals December 2026 law:
the 2026 brackets changed mid-year with retroactive effect. When a value is not
explicitly year-stamped, treat it as `likely`, not `verified`.

## 11. What is legally load-bearing (do not “improve”)

- Maximum withholding when the form is missing (reg. 5(a)).
- The 7-day / 1-January deadlines.
- The “other income” and “second job” answers: they change the withholding rate.
- The employee declaration and the 7-day change undertaking.
- The employer’s duty to demand, verify and retain the form.
- The distinction between a **credit** (reduces tax) and an **exemption** (removes
  income from tax) — item 2 is an exemption, not a point.

## 12. Disclaimers

This graph is an implementation aid, not legal advice. Israeli payroll law changes
by circular and by retroactive legislation; the app must show a “verify with the
Tax Authority / payroll” notice and must not present an estimate as a binding
calculation.

## 13. What I could not verify

1. **A specific fine on the employee for late/non-filing.** The regulations impose
   maximum withholding; the declaration says false details are an offence; no
   fixed employee fine was found.
2. **A specific sanction on an employer that fails to demand the form.** Regulation
   2(c) imposes the duty, but the enforcement provision was not located.
3. **The full official parents table.** The gov.il page was only partially readable
   from this network; the values are cross-checked against the ordinance ss. 40/66
   and Kol Zchut. The separated-parent rows are the least certain.
4. **A direct Tax Authority URL for the 2026 blank form.** The 2026 rules circular
   and the 2024 blank PDF are on gov.il; the 11.2025 blank PDF was taken from the
   tofes101.co.il mirror and matches the official layout/metadata.
5. **Returning-resident administrative tracks.** The s. 35(d) definition and the
   2026 temporary law are verified; the intermediate “תושב חוזר ותיק” thresholds
   and the exact 101 treatment are not.
6. **Same-sex couples and non-binary gender.** The form is binary/gendered; no
   official path was found. Route to the assessor.
7. **National-service credit’s exact statutory basis.** The 1 point/year × 36
   months is the Tax Authority/Kol Zchut position; s. 39א itself is soldier-specific.
8. **Deduction-file check digit.** The personal-ID algorithm is verified; whether
   it applies to תיק ניכויים is not.
9. **Privacy thresholds for a small local-only app.** Amendment 13 is verified;
   whether a static host’s IP logs make the developer a controller is a legal
   characterisation.
10. **The 2026 oleh/returning-resident exemption circular.** The ceilings are in the
    official booklet; the operational circular was pending when the booklet was
    updated.
11. **Sailor/foreign-expert/treaty exemptions.** These are outside the 101’s
    checkboxes and were not researched; route to the assessor.

## Children

- [[law/form-101-official-pdf]] — the artifact, page by page
- [[law/form-101-section-map]] — every section and item, who fills it, mandatory?
- [[law/personal-details]] — section ב: identity, address, phones, gender, marital status, kibbutz
- [[law/who-must-file]] — employee, daily worker, foreign worker, pensioner, minor
- [[law/submission-deadlines]] — 7 days, 1 January, changes, 2(e)
- [[law/employer-obligations]] — demand, verify, withhold, report, retain
- [[law/withholding-mechanics]] — max rate, salary types, monthly formula
- [[law/tax-coordination]] — 101 section ט, form 116, multiple employers
- [[law/credit-points]] — the hub for all credit tracks
- [[law/credit-point-value]] — 2,904 / 242 and the freeze
- [[law/credit-points-2026]] — 2026 snapshot
- [[law/tax-brackets-2025]] · [[law/tax-brackets-2026]]
- [[law/children-credit-points]] — the age/parent table
- [[law/single-parent-credit]] — +1, custody, separated parents
- [[law/spouse-not-working]] — 1 point, conditions, 25,410
- [[law/new-immigrant]] · [[law/returning-resident]]
- [[law/soldier-credit]] · [[law/reserve-credit]]
- [[law/credit-points-studies]] — 119 lives here
- [[law/alimony-credit]] · [[law/disabled-child-credit]] · [[law/youth-credit]]
- [[law/disability-exemption]] — item 2 is not a point
- [[law/residency-and-foreign-workers]]
- [[law/id-number-validation]] · [[law/marital-status]] · [[law/children-details]]
- [[law/privacy-consent]] · [[law/declaration-and-signature]] · [[law/retention]]
- [[law/edge-cases]] · [[law/glossary]]

## Sources

- [[source/tofes101-official-pdf]]
- [[source/taxes-electronic-101-rules-2026]]
- [[source/wikisource-payroll-withholding-regulations]]
- [[source/nevo-income-tax-ordinance]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
