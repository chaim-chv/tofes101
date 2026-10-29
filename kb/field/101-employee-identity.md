---
id: field/101-employee-identity
title: שדה — זהות העובד (ת"ז / דרכון)
type: field
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, field, identity, validation]
sources: [source/tofes101-form-runner-api, source/tofes101-official-pdf]
related: [flow/form-101-service, law/id-number-validation]
up: flow/form-101-service
---

# זהות העובד/ת

The single most consequential branch in the form: **ID vs passport** decides
which sections exist at all.

## Reference behaviour

```
זיהוי לפי:  ( ) תעודת זהות        ( ) דרכון (עבור אזרח זר)
```

- `idNum` → 9-digit Israeli ID, validators: digits-only, integer, Luhn.
  Optional uploads: `צילום תעודת זהות וספח`.
- `passport` → `מדינת הדרכון` (select) + `מספר דרכון` (free text) + optional
  `צילום דרכון` + `אישור / רשיון שהייה בישראל`.
- Passport holders lose: the entire children section (alert: "אינו רלוונטי משום
  שהינך מזוהה עם דרכון זר"), `תושב ישראל`, kibbutz questions, `תאריך עליה`.
- A hidden `idStr` mirror is computed for the PDF: `{idNum: idNum, passport: passportNum}[type]`.

## Validation

Israeli ID check digit ("Luhn", סיפרת ביקורת):

```ts
function isValidIsraeliId(raw: string): boolean {
  const s = raw.replace(/\D/g, "");
  if (s.length > 9 || s.length === 0) return false;
  const padded = s.padStart(9, "0");
  if (/^0+$/.test(padded)) return false;          // all zeros passes Luhn but is not an ID
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = Number(padded[i]) * (i % 2 === 0 ? 1 : 2);
    sum += d < 10 ? d : d - 9;
  }
  return sum % 10 === 0;
}
```

Verified locally: `000000018` ✅, `123456782` ✅, `000000000` ❌ (rejected by the
explicit zero check), `123456789` ❌.

⚠️ **Leading zeros are significant.** Store and display as a string; an `<input
type="number">` will destroy `012345678`. Use `inputmode="numeric"` +
`pattern="[0-9]*"` + `maxlength=9`.

⚠️ `type="number"` also breaks screen readers, scroll-wheel and RTL digit
rendering. Never use it for identifiers. See [ux/ux-principles](../ux/ux-principles.md).

## What we build

- One question: `איך נזהה אותך?` with two large cards (ת"ז / דרכון), keyboard
  reachable, `role="radiogroup"`.
- ID input: 9 digits, grouped display `123-456-789` **only visually** (value stays
  raw), checksum validated on blur with a specific message
  ("מספר הזהות אינו תקין — בדוק/י את 9 הספרות"), never only "שדה לא תקין".
- Passport: country select with a searchable list (Hebrew names), number without
  masking, and a clear note that the residence permit may be required.
- **Do not** hide the children section for passport holders silently: show a
  disabled panel with the reason and a link to the rule
  ([law/id-number-validation](../law/id-number-validation.md)). The reference
  hides it, which reads like a bug.
- Keep the answers when the user switches type (ID → passport → ID). Never wipe.
- Autofill: `autocomplete="off"` — this is not a name/email field the browser
  should guess.

## Accessibility

- The two cards are radios, not buttons: arrow keys must move between them.
- The ID field needs `aria-describedby` pointing at the format hint **and** the
  error, and `dir="ltr"` + `style="unicode-bidi: isolate"` so the digits and the
  hyphen do not jump in an RTL line.
- Announce checksum failure politely; do not steal focus until submit.

## Related

- [law/id-number-validation](../law/id-number-validation.md) — the legal/technical
  basis and whether the check digit is actually mandated.
- [field/101-employee-tax-status](./101-employee-tax-status.md) — the questions
  that disappear for passport holders.
