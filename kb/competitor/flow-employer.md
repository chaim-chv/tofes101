---
id: competitor/flow-employer
title: Competitor flow — employer creates a template link
type: finding
status: verified
confidence: verified
updated: 2026-10-29
tags: [competitor, flow, employer, b2b, template]
sources: [source/tofes101-itc101-employer-landing, source/tofes101-docs-custom-form, source/tofes101-form-runner-api, source/tofes101-engine-bundle]
related: [competitor/flow-employee, competitor/feature-parity, product/scope-v1, product/personas]
up: index
---

# Employer flow — "create a link, send it, get PDFs by email"

This is the B2B half of the product and, commercially, the important half: the employee
flow is the free funnel, the employer flow is where the SaaS upsell lives.

## 1. Two pages, one app

| Route | What it is |
| --- | --- |
| `/forms/itc-101/organizations/` | marketing landing. "שירות חינמי למעסיקים", 3-step explainer, 2 CTAs, 3 benefit bullets. ~136 words. |
| `/forms/itc-101/create/` | the builder. Client-rendered shell; it is the **same runner** as `/submit/`, opened with `data.entry.status = "template"` (schema gates the whole form on `data.entry.status !== 'template'` and shows `settingsWrap` instead). |

There is no employer account, no dashboard, no login. The landing says it twice:
"זה חינם ולא דורש הרשמה". The *link* is the employer's only persistent state.

## 2. Screen map (builder)

```
[1] /forms/itc-101/organizations/   pitch → CTA "יצירת קישור לשליחה לעובדים"
[2] /forms/itc-101/create/          runner in template mode
      ├─ settingsWrap  (panel "הגדרות טופס", show:false until template mode)
      │    ├─ תצוגה:  logo on/off + image + link
      │    ├─ בדיקות: employee email required|optional,
      │    │          tax-coordination warning error|warn|none,
      │    │          teen credit-point warning warn|none
      │    ├─ נספח:   medical certificate for minors, active-service question,
      │    │          soldier work permit, soldier ID, national-service permit,
      │    │          bank details required|optional|none + ownership proof
      │    └─ נתונים התחלתיים: income type(s) + "lock income type"; advanced
      ├─ employer block (org name, address, phone, deduction file no., receiving email)
      │    └─ "נעל עריכה של פרטי המעסיק" (lockA) + logo
      ├─ preview of the rest of the form (the employee's view)
      └─ CTA "צור את הטופס"
[3] link shown on screen            e.g. https://tpz.link/81dzq
[4] employer distributes it         email / WhatsApp / SMS / internal portal
[5] employee fills & signs
[6] PDF emailed to employer + employee
```

## 3. What the employer actually configures

Every one of these is a field in the `_settings` section of the same 101 schema
(`research/raw/site/form-tree.txt`, lines ~389–440). This is the complete list — i.e.
the employer product is **13 settings plus an org block**:

| Group | Setting | Options / default | Effect on the employee |
| --- | --- | --- | --- |
| display | `showLogo` + `logoImageSrc` / width / link | off by default in base form | employer logo in the form header and on the PDF |
| validation | `employeeEmail` | `required` (default) / `optional` | whether the employee must give an email |
| validation | `taxCoordinationWarning` | `error` / **`warn` (default)** / `no` | when the employee's answers imply mandatory tax coordination, show an error, a warning, or nothing |
| validation | `teenagerCreditPointNotUtilizedWarning` | **`warn`** / `no` | warn when a 16–18-year-old could claim the youth credit and didn't |
| appendix | `youngEmployeeMedicalCertificate` | `required` / **`no`** | under-18 employees are asked for a family-doctor work certificate |
| appendix | `inActiveService` | `required` / **`no`** | whether the employee is asked about mandatory service at all |
| appendix | `militaryServiceWorkPermitCertificate` | `required` / `no` | soldier's private-work permit |
| appendix | `militaryServicePersonalCertificate` | `required` / `no` | soldier's service ID |
| appendix | `nationalServiceWorkPermitCertificate` | `required` / `no` | national-service work permit |
| appendix | `bankAccount` | `required` / `optional` / **`no`** | adds bank-details fields (account, branch, bank) as mandatory/optional |
| appendix | `bankAccountOwnershipCertificate` | `required` / `no` | asks for a cheque photo / account-management letter |
| initial data | `thisIncome.types` (+ `thisIncomeTypesReadonly`) | none | pre-answers section ד ("monthly salary" etc.) and optionally locks it |
| advanced | `advancedRow` | — | (fields not enumerated in the dump) |
| org block | name, address, phone, **deduction file number**, receiving email, `lockA` | — | fills section א and locks it if chosen |

Two important consequences:
- The **receiving email is a required field on the org block** with help text
  "הטפסים יישלחו גם אליך וגם לעובדים שמילאו אותם" — that is the entire delivery
  mechanism. If it is wrong, the form is lost.
- The employer can fold **bank details** into the 101 link, which is why the pitch
  "one link, all the onboarding paperwork" is credible — and why the upsell to
  עובדיםIO (a full onboarding product) appears at exactly that point.

## 4. What the employee sees differently

- Section א (employer) arrives **pre-filled and read-only** when `lockA` is set; if it is
  not locked the employee can edit it.
- The receiving email is pre-set (the docs call this the main benefit: it removes
  "mistakes typing the email address").
- Extra required uploads appear in the appendix, per the employer's toggles (bank
  ownership proof, army/national-service permits, medical certificate).
- Section ד may already be answered (income type) and locked.
- Warnings/errors about tax coordination behave per the employer's setting.
- The logo and (optionally) a link to the employer replace the Tepez branding in the
  header — but the Tepez disclaimer and the ads are still there (the ad panel is not
  configurable off; see
  [competitor/monetization-and-tracking](monetization-and-tracking.md)).

## 5. Delivery, and its failure modes

- On submit: one PDF per employee, **emailed to the employer address and to the
  employee**. No dashboard, no status board, no reminder, no "who hasn't filled it yet".
- The employer's own archive is their inbox. The landing sells this as a benefit
  ("לעולם לא תאבדו טופס — חיפוש פשוט בתיבת האימייל"), which is a fair description of a
  product with no backend for the employer.
- The FAQ asks "how do I update the employer details / email in a template I already
  created?" — **no answer published**. There is no edit UI implied anywhere; the link is
  the object, and the settings live in it. That is a real operational trap: change your
  finance email and every previously shared link keeps sending to the old address.
- WhatsApp distribution has a documented gotcha (their own docs): the link is only
  tappable if the sender's number is in the employee's contacts; otherwise it is plain
  text that must be copied into a browser.

## 6. The commercial layer hidden in this flow

Inside the employer's builder, below the org block, sits an `eHtml` promo block
("רוצים לצרף לטופס גם פרטי חשבון הבנק ואת כל שאר הטפסים שלכם? הכירו את עובדים.IO…")
followed by a **required** radio `ovdimioNotify` — "✅ כן, אשמח לפרטים נוספים" /
"🚫 לא כרגע, תודה" — and a free-text "how can we help" box when yes.
If they decline, an alert answers "אין בעיה 🙂 הטפסים החינמיים שלנו זמינים עבורכם תמיד".

So: the "free employer tool" is a lead form for a paid HR-onboarding SaaS, embedded in
the employer's own form builder, with the decline path softened by an emoji. It is
honest enough (the answer is optional and the copy is clear), but it is the actual
business model of the employer side.

Which forms support templates at all (`canCreateTemplate` in the registry): itc-101,
itc-161, bank-account, electronic-pay-slip, anti-sexual-harassment, btl-103, btl-250,
gym-health-declaration, police-adult-certificate, police-criminal-record. Not the
calculators, not 119.

## 7. What we can and cannot mirror in v1 (no emailing)

| Employer need | Their answer | Our v1 answer |
| --- | --- | --- |
| pre-fill the org block | template link with `lockA` | **yes** — same idea, encoded in the URL (or a small file) |
| stop typos in the receiving address | hard-coded email in the link | **yes, better** — there is no address to typo because nothing is emailed |
| collect the signed PDFs | email to one inbox | **no** — v1 returns a PDF + a "send to employer" package the employee hands over (download / share sheet / QR) |
| know who is missing | nothing | n/a — we do not want the employee list |
| update settings later | nothing (links are immutable) | **yes** — the template payload is versioned in the URL fragment, and we can ship a re-generate + diff flow |
| one link for 101 + bank details | `bankAccount` toggle | **later** — same mechanism, extra step |

Honest summary: the employer flow is *cheap to match on configuration* and *impossible
to match on delivery* without a server. The v1 employer story is therefore
"**zero-setup template link, no data collection, and the employee sends you the file**" —
which is a weaker promise on paper and a stronger one on privacy.
