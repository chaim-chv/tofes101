---
id: law/id-number-validation
title: מספר זהות — Israeli ID validation and formatting
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, id-number, validation, checksum]
sources: [source/id-checksum-reference, source/taxes-form-101-2026]
related: [law/form-101, law/children-details, law/marital-status]
up: law/form-101
---

# Israeli ID validation

## 1. Format

- An Israeli ID number (מספר זהות) is **9 digits**, including a check digit.
- It may have leading zeros; store it as a **string**, never as a number.
- Display: usually 9 digits without a separator; some systems show `12345678-9`.
  Do not require the hyphen; strip spaces/hyphens on input.
- The number is printed in the ID card and its ספח. The form asks for the number
  “9 ספרות”.

## 2. Check-digit algorithm

Left-pad the input to 9 digits. From the left (index 0), multiply digit *i* by
`1` if *i* is even and `2` if *i* is odd. Sum the decimal digits of each product
(e.g. 16 → 1+6 = 7). The number is valid if the total is divisible by 10.

Equivalent: `check = (10 - (sum % 10)) % 10`, and `check` must equal the 9th digit.

```ts
export function isValidIsraeliId(input: string): boolean {
  const s = input.replace(/[\s-]/g, "");
  if (!/^\d{1,9}$/.test(s)) return false;
  const id = s.padStart(9, "0");
  if (id === "000000000") return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const p = Number(id[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(p / 10) + (p % 10);
  }
  return sum % 10 === 0;
}
```

Test vectors:

| Input | Valid? | Note |
| --- | --- | --- |
| `000000018` | yes | classic valid example |
| `123456782` | yes | classic valid example |
| `000000000` | no (special-cased) | passes the arithmetic but is not a real ID |
| `123456789` | no | wrong check digit |

## 3. What the check does and does not prove

- It detects **typing errors** (single-digit and most transpositions).
- It does **not** prove the number exists, belongs to the person, or is current.
- It is not an identity check; the employer must compare the number with the ID
  card/ספח and, for online services, use the government identity provider.
- Do not reject an ID because it is “unusual”; the number space includes old and
  new IDs.

## 4. Passport fallback

- If the employee has no Israeli ID, the form uses **passport number** + visa/
  residence permit. Do not run the Israeli check digit on a passport.
- Accept 6–9 alphanumeric characters; normalize to uppercase; do not enforce a
  country-specific pattern without a source.
- The passport path hides the Israeli-resident/child/credit sections in the 2026
  electronic matrix.

## 5. Deduction-file numbers (תיק ניכויים)

- Employer deduction-file numbers are 9 digits and usually start with 9, but they
  are **assigned by the Tax Authority**, not personal IDs. Do not apply the
  personal-ID check digit to them unless the Tax Authority says the same algorithm
  applies. The competitor’s Luhn check on this field may reject valid files.
- Validate length/digits and, at most, a leading 9; leave the rest to the employer.

## 6. Privacy

- Treat the ID as sensitive personal data: do not log it, do not put it in URLs,
  do not send it to analytics, mask it in the UI after entry, and clear it from
  memory when the session ends.
- For children, the same rules apply; the form collects the child’s ID.

## 7. Unverified

- Whether the Tax Authority uses the same check digit for deduction-file numbers
  (no official statement found).
- Any special format for old IDs with fewer than 9 digits (the algorithm
  left-pads; the form expects 9).
