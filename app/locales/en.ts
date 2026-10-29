/**
 * English UI strings. Keep the same keys as `he.ts`.
 * Legal terms keep the Hebrew in parentheses on first use — see
 * kb/glossary/terms.md for the naming rules.
 */
export default {
  "app.name": "Form 101",
  "app.tagline": "Employee tax card — online, with no server and no ads",

  "nav.home": "Home",
  "nav.employer": "For employers",
  "nav.form": "Fill the form",
  "nav.language": "עברית",

  "privacy.badge": "Your data stays on this device",
  "privacy.line": "We never send your details anywhere. No account, no ads, and no server that receives the form.",

  "home.h1": "Form 101 — fill it once, download the file.",
  "home.lead":
    "A guided, checked flow for Israeli ITC Form 101 (employee tax card) for tax year 2026, with plain-language help for every field and credit — and the file stays with you.",
  "home.cta.start": "Start filling",
  "home.cta.employer": "I'm an employer — prepare a link",
  "home.point.local.title": "Everything on-device",
  "home.point.local.body": "Answers are saved in your browser only. Export a backup file or erase everything in one click.",
  "home.point.fast.title": "Keyboard-fast",
  "home.point.fast.body": "Fill the whole form without a mouse, with shortcuts and a predictable step order.",
  "home.point.right.title": "Explained line by line",
  "home.point.right.body": "Every field has a plain-language explanation, and every credit lists the documents it needs.",

  "employer.h1": "Prefilled link for employees",
  "employer.lead":
    "Enter the employer details and get a link your employees can open with those details already in place. The link is built on your device; we don't see who opened it and we never receive the forms.",
  "employer.field.name": "Employer name",
  "employer.field.address": "Address",
  "employer.field.phone": "Phone",
  "employer.field.deductionFile": "Deductions file number",
  "employer.field.lock": "Lock these details for the employee",
  "employer.result.title": "Your link",
  "employer.result.copy": "Copy link",
  "employer.result.copied": "Link copied",
  "employer.result.download": "Download JSON",
  "employer.result.qr": "QR code",
  "employer.result.fingerprint": "Link fingerprint",
  "employer.warning": "The link contains the company details you typed. Never put employee personal data in it.",

  "form.h1": "Fill Form 101",
  "form.prefill.title": "Details for {name} were prefilled",
  "form.prefill.accept": "Accept and continue",
  "form.prefill.dismiss": "No, I'll fill it myself",
  "form.prefill.locked": "Locked by the employer",
  "form.badPayload": "This link is invalid or from an unsupported version. You can continue and enter the details manually.",

  "common.next": "Continue",
  "common.back": "Back",
  "common.copy": "Copy",
  "common.optional": "Optional",
  "common.required": "Required",
  "common.close": "Close",
  "common.unknown": "I don't know",
} as const
