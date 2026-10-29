---
id: law/credit-point-value
title: שווי נקודת זיכוי — Value per point, 2024–2027
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [law, credit-points, value, 2025, 2026]
sources: [source/taxes-monthly-deductions-2025, source/taxes-monthly-deductions-2026, source/nevo-income-tax-ordinance]
related: [law/credit-points, law/credit-points-2026, law/tax-brackets-2026]
up: law/credit-points
---

# שווי נקודת זיכוי

## 1. The value

| Tax year | Annual value | Monthly value | Source |
| --- | --- | --- | --- |
| 2023 | 2,820 ₪ | 235 ₪ | historical (s. 33א note) |
| 2024 | 2,904 ₪ | 242 ₪ | s. 33א + 2025/2026 booklets |
| 2025 | **2,904 ₪** | **242 ₪** | 2025 booklet p. 10 |
| 2026 | **2,904 ₪** | **242 ₪** | 2026 booklet p. 12 |
| 2027 | 2,904 ₪ (frozen) | 242 ₪ | freeze law 2024, s. 33א note |

The freeze law (חוק ההתייעלות הכלכלית (הקפאת עדכוני מס ומס יסף), התשפ״ה-2024)
provides that amounts linked to s. 120ב are **not indexed** on 1 January of
2025–2027. That is why 2024, 2025 and 2026 share the same point value.

## 2. Arithmetic

```
annual value of N points = N × 2,904 ₪
monthly value            = N × 242 ₪
```

Examples:

| Points | Annual | Monthly |
| --- | --- | --- |
| 0.5 | 1,452 ₪ | 121 ₪ |
| 1 | 2,904 ₪ | 242 ₪ |
| 1.5 | 4,356 ₪ | 363 ₪ |
| 2 | 5,808 ₪ | 484 ₪ |
| 2.25 | 6,534 ₪ | 544.5 ₪ |
| 2.75 | 7,986 ₪ | 665.5 ₪ |
| 4 | 11,616 ₪ | 968 ₪ |

## 3. What the value does **not** mean

1. It is not a payment. It is a deduction from tax; if the tax is already zero,
   the point produces no cash.
2. It is not the marginal tax saving of a deduction: a point saves 2,904 ₪ of
   **tax**, regardless of the employee’s bracket (subject to having enough tax).
3. It is not indexed monthly; the annual value is fixed and divided by 12.
4. It is not the same as the “נקודת קיצבה” (pension point) used by NII; that is a
   separate concept (242 ₪/month in 2024–2027, but with a different legal basis).

## 4. Implementation

- Store the value **per tax year** in a data file, never as a constant named
  `CREDIT_POINT`.
- Use integer agorot or decimal arithmetic; 242 × 2.25 = 544.5, so half-shekel
  monthly values are normal.
- Display “2,904 ₪ לשנה (242 ₪ לחודש)” in help text, not just one of the two.
- When showing an estimate, label it “הערכה” and state that the payroll/assessor
  determines the final amount.

## 5. Sources and confidence

Verified against the official 2025 and 2026 withholding booklets (p. 10 and p. 12
respectively) and the consolidated ordinance s. 33א. The 2027 value is frozen by
the same law but is not needed for the 2026 launch; keep it as a forward-looking
constant only if the data model supports year stamping.
