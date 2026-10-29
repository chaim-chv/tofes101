---
id: law/personal-details
title: פרטי העובד — Section ב: identity, address and status fields
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, form-101, personal-details, validation, identity]
sources: [source/tofes101-official-pdf, source/taxes-electronic-101-rules-2026]
related: [law/form-101, law/id-number-validation, law/marital-status, law/residency-and-foreign-workers]
up: law/form-101
---

# Section ב — personal details

The official form and the 2026 electronic matrix
([[source/taxes-electronic-101-rules-2026]], נספח א) define these fields. The
paper form is the label authority; the matrix is the mandatory/conditional
authority.

## 1. Field table

| Field | Hebrew | Required | Rules / meaning |
| --- | --- | --- | --- |
| Identity type | יש לי מספר תעודת זהות? | **M** | yes/no; exactly one. If yes, ID number; if no, passport. |
| ID number | מספר זהות | **C** (if ID) | 9 digits; check digit; leading zeros preserved; attach ID + ספח. |
| Passport number | מספר דרכון | **C** (if no ID) | 6–9 alphanumeric; attach passport + visa/residence permit. |
| Surname | שם משפחה | **M** | exactly as printed in the ID (or passport). |
| First name | שם פרטי | **M** | exactly as printed in the ID (or passport). |
| Birth date | תאריך לידה | **M** | past date; drives age/youth/child/retirement rules. |
| Aliyah date | תאריך עליה | O | only meaningful for olim; must be ≤ today and ≥ birth date. |
| Street/neighbourhood | רחוב/שכונה | **M** | free text or locality data. |
| House number | מספר | **M** | free text (Hebrew letters allowed, e.g. 12א). |
| City/locality | עיר/ישוב | **M** | select from the official locality list. |
| Postcode | מיקוד | O | 7 digits; do not reject foreign/old formats. |
| E-mail | כתובת דואר אלקטרוני | O | optional; do not require. |
| Phone | מספר טלפון | **M** (at least one phone) | Israeli landline/mobile; the matrix requires at least one of phone/mobile. |
| Mobile | מספר טלפון נייד | **M** (at least one phone) | Israeli mobile; at least one of the two. |
| Gender | מין | **M** | male/female only; drives the 0.5 woman point and mother/father child tracks. |
| Marital status | מצב משפחתי | **M** | single/married/divorced/widowed/separated; “separated” needs assessor approval. |
| Israeli resident | תושב ישראל | **M** (if ID) | yes/no; “no” suppresses the 2.25 base; passport path hides the field. |
| Kibbutz member | חבר קיבוץ/מושב שיתופי | **M** | no / yes-income transferred / yes-income not transferred. |
| Health fund | חבר בקופת חולים | O | no / yes + fund name; if yes, name required; if no, name disabled. |

## 2. Identity rules

- The ID and passport are mutually exclusive; the form asks “has ID?” first.
- The ID must match the attached ID card/ספח; a checksum-valid number is not proof
  of identity.
- A passport-only employee must attach the passport **and** a visa/residence
  permit issued by the Population and Immigration Authority.
- A new immigrant may have a תעודת עולה and an A/1 visa before an Israeli ID; do
  not force the ID path. But the 2026 electronic matrix hides section ח for
  passport-only employees, so the oleh credit may need the paper/assessor route.
  See [[law/new-immigrant]].
- A foreign worker uses the passport path; see
  [[law/residency-and-foreign-workers]].

## 3. Address rules

- The form wants a **private** address, not the employer’s.
- City/locality should come from the official list; do not allow a free-text city
  that cannot be matched for the settlement benefit (item 3).
- Postcode is optional; do not block submission.
- A PO box is not a private address; ask for street + house number.
- If the employee lives abroad, the 101 is probably not the right form; route to
  the assessor.

## 4. Phone/e-mail rules

- At least one phone (landline or mobile) is required; the matrix requires both
  fields to be considered, but the practical rule is “at least one”.
- Validate Israeli numbers loosely: `0[2-9]\d{7,8}` for landline, `05\d{8}` for
  mobile; accept `+972` and strip separators.
- E-mail is optional; validate only if entered.
- Do not use the phone/e-mail for marketing; see [[law/privacy-consent]].

## 5. Gender and marital status

- Gender is binary on the form; do not add a third option. See
  [[law/marital-status]] for the five statuses and the “פרוד/ה” gate.
- The 0.5 woman point is tied to the form’s “נקבה”; a person whose legal gender is
  different should follow the ID and seek advice. **Unverified.**

## 6. Kibbutz and health fund

- Kibbutz member: if income is transferred to the kibbutz, the kibbutz is the tax
  unit for that income; the member’s personal credits may be handled separately.
  Capture the status and route to the kibbutz payroll.
- Health fund: the form only asks membership + fund name, not policy details. It is
  optional; do not infer health status.

## 7. Implementation

1. Render section ב as one step with clear required markers.
2. Validate the ID/passport atomically (type + number + attachment).
3. Derive age at the end of the tax year; show it as help, not as a field.
4. Gate the spouse block on marital status = married.
5. Gate the aliyah date on the oleh path; do not show it for everyone.
6. Keep the city/locality as a select with a search; allow “other” only with a
   warning.
7. Do not put the ID/phone/e-mail in the URL or logs.
8. Preserve leading zeros in the ID and postcode.

## Sources

- [[source/tofes101-official-pdf]]
- [[source/taxes-electronic-101-rules-2026]]
