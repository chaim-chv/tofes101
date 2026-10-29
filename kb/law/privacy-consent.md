---
id: law/privacy-consent
title: פרטיות והסכמה — Privacy law for a browser-only 101 tool
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, privacy, consent, amendment-13, browser-only]
sources: [source/govil-privacy-amendment-13, source/taxes-electronic-101-rules-2026]
related: [law/form-101, law/declaration-and-signature, law/retention, law/employer-obligations]
up: law/form-101
---

# Privacy and consent

## 1. The legal frame

1. **חוק הגנת הפרטיות, התשמ״א-1981** (Privacy Protection Law) is the general
   statute. **תיקון 13** entered into force on **14.8.2025** and is the current
   regime ([[source/govil-privacy-amendment-13]]).
2. The amendment expanded the definition of “personal data”, narrowed the duty to
   register databases, added notification for large/sensitive databases, added the
   DPO duty for certain entities, raised administrative fines and added criminal
   offences.
3. Sector-specific rules (employment, payroll, tax) sit on top. The Tax Authority’s
   2026 electronic-101 circular requires a secure, versioned archive and limits
   access to the employer’s process.

## 2. Does form 101 need “consent”?

**No — not in the GDPR sense.** The employer processes the data because the law
requires it:

- regulation 2 requires the employee to fill the form;
- s. 164 requires the employer to withhold tax at source;
- the employer must keep the form for the tax audit.

The employee’s signature on the form is a **declaration of truth** and an
undertaking to notify changes, not a privacy consent. There is no “I agree to the
processing of my data” checkbox on the official form, and adding one does not
replace the statutory basis. If the employer wants to use the data for anything
else (marketing, sharing with advertisers), that needs a separate lawful basis and
notice — and is outside the 101.

## 3. Who is the controller in a browser-only app?

| Scenario | Controller | Notes |
| --- | --- | --- |
| The app runs entirely in the employee’s browser; no data is sent to the developer | The **employer** (for the employment file) / the **employee** for their own draft | The developer receives no personal data; still avoid logs/analytics |
| The app sends data to a server, email, cloud sync, or analytics | The entity operating that service is a controller/processor | Requires a privacy notice, security, DPA, registration/notification analysis |
| The employer uses a prefill link containing only employer details | The employer | Avoid putting employee data in URLs |

If the app is hosted on a static host, the host may log IP addresses; that is
personal data under the amended definition. Use a host with minimal/no logs, or
disclose it. Do not use third-party fonts, CDNs, error trackers or session replay.

## 4. What data the form contains

- ID number, name, address, phone, e-mail, gender, marital status.
- Children’s names, IDs and birth dates.
- Spouse’s ID/name/birth date and income status.
- Health-fund membership (not detailed health data, but still sensitive in
  context).
- Income type and employer details.
- Disability/blindness status and certificates.
- Aliyah/returning-resident status.
- Signatures.

Treat the whole form as **high-risk personal data**, even where a specific field is
not in the statutory “sensitive data” list. Children’s data and disability data are
especially sensitive.

## 5. Duties that matter for the product

1. **Purpose limitation** — use the data only to fill/print the 101 and, for the
   employer, to run payroll. No ads, no lead-gen, no sale.
2. **Data minimisation** — ask only for fields the official form requires; do not
   add “nice to have” fields (e.g. bank account, ethnicity, exact income of the
   spouse).
3. **Storage limitation** — keep drafts only as long as the user needs; offer
   “delete my data”; the employer keeps the final form for the retention period.
4. **Security** — local-only by default; if storage is used, protect it; do not put
   personal data in URLs, logs, analytics, error reports or browser history.
5. **Transparency** — a short privacy notice: what is stored, where, for how long,
   who can see it, how to delete/export.
6. **Access/correction** — the user can view and correct their data; the employer
   must correct the payroll record.
7. **DPO/registration** — for a small local-only tool, likely not applicable; for
   an employer-wide system or a cloud service, analyse under Amendment 13.
8. **Children** — extra care; no marketing, no profiling, no sharing.

## 6. Browser-only implementation checklist

- No backend, no database, no account, no email sending.
- No analytics, no GTM, no Meta pixel, no Sentry, no session replay, no hotjar.
- Self-host fonts and assets; no Google Fonts/CDN; no third-party scripts.
- Store drafts in `sessionStorage` by default; use `localStorage`/IndexedDB only
  with an explicit “save on this device” choice.
- Warn on shared/public computers; offer “clear data” and “download PDF, then
  delete”.
- Do not put personal data in the URL/query/hash; the employer prefill link should
  carry only employer fields.
- If local encryption is offered, use WebCrypto with a user passphrase; do not
  claim “military-grade” or “unbreakable”.
- Generate the PDF client-side; do not upload it to a conversion service.
- Set a strict CSP; no `eval`, no remote script.
- Avoid service-worker caching of form data; if used, exclude sensitive routes.
- Do not log form values; redact errors.
- Provide a privacy notice and a “delete everything” action.
- Do not claim “100% anonymous” or “GDPR compliant” without a legal review.

## 7. The employer’s archive

- The employer is the controller of the final form; it must secure access, keep it
  for the retention period, and delete/anonymise afterwards.
- The 2026 circular requires a retrievable archive of the form, attachments,
  employee confirmation and all previous versions.
- Do not send the archive to the app vendor.

## 8. What could not be verified

- The precise Amendment 13 registration/notification thresholds for a small
  employer or a consumer app.
- Whether a static host’s IP logs make the developer a controller in the specific
  configuration; this is a legal characterisation, not a technical fact.
- The DPO threshold for a payroll bureau; route to counsel.

## Sources

- [[source/govil-privacy-amendment-13]]
- [[source/taxes-electronic-101-rules-2026]]

Every normative statement above is based on these nodes; year-specific values are stamped in the text.
