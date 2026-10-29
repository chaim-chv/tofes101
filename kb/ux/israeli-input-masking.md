---
id: ux/israeli-input-masking
title: מסכות קלט ישראליות — ת"ז, טלפון, תאריך, סכום
type: pattern
status: verified
confidence: likely
updated: 2026-10-29
tags: [forms, israel, validation, id, phone, dates, money]
sources: [source/govuk-dates, source/mdn-inputmode, source/w3c-wcag22]
related: [ux/validation-and-errors, ux/bidi-mixed-content, ux/autofill-tokens]
up: ux/ux-principles
---

# מסכות קלט ישראליות

`confidence: likely` לאלגוריתמים (ת"ז, טלפון) — הם תואמים את הפרקטיקה
הישראלית אך יש לאמת מול מקור רשמי/בדיקות לפני הסתמכות משפטית.

## עיקרון-על

**אל תמסכו תו-אחר-תו אם זה מזיז את הסמן.** עצבו ערך, ואז פרמטו ב-`blur`.
בזמן הקלדה: ספרות בלבד, בלי רווחים. ב-`blur`: `050-1234567`.

```ts
const digits = (s: string) => s.replace(/\D/g, "")
```

## תעודת זהות ישראלית

9 ספרות, כולל ספרת ביקורת. אלגוריתם (Luhn מותאם):

```ts
export function isValidIsraeliId(raw: string): boolean {
  const s = raw.replace(/\D/g, "").padStart(9, "0")
  if (s.length !== 9) return false
  let sum = 0
  for (let i = 0; i < 9; i++) {
    let d = Number(s[i]) * ((i % 2) + 1)   // 1,2,1,2,...
    if (d > 9) d -= 9
    sum += d
  }
  return sum % 10 === 0
}
```

- `padStart(9,"0")` — ת"ז קטנה מוצגת עם אפסים מובילים; **אל** תמחקו אפסים.
- הודעות: "חסרה ספרה" / "ספרת הביקורת אינה תואמת — בדקו שהקלדתם 9 ספרות".
- `maxlength="11"` כדי לאפשר הדבקה עם רווחים/מקפים, ואז ניקוי.
- **אל** תחסמו הדבקה. הדבקה היא כלי נגישות (3.3.8).

## טלפון

| סוג | פורמט | ולידציה |
| --- | --- | --- |
| נייד | `05X-XXXXXXX` (10 ספרות) | מתחיל ב-`05`, 10 ספרות |
| קווי | `0X-XXXXXXX` (9 ספרות) | מתחיל ב-`0`, 9 ספרות |
| בינלאומי | `+972-5X-XXXXXXX` | מנורמל ל-`05X…` |

```ts
export function normalizeIlPhone(raw: string): string | null {
  let d = raw.replace(/\D/g, "")
  if (d.startsWith("972")) d = "0" + d.slice(3)
  if (d.length === 10 && d.startsWith("05")) return `${d.slice(0,3)}-${d.slice(3)}`
  if (d.length === 9 && d.startsWith("0")) return `${d.slice(0,2)}-${d.slice(2)}`
  return null
}
```

- הציגו את הפורמט המנורמל ב-`blur`, לא תוך כדי הקלדה.
- `type="tel"` + `inputmode="tel"` (לא `number`).
- אל תדרשו `+972`; קבלו אותו בשקט.

## תאריכים

- שלושה שדות: יום / חודש / שנה ([GOV.UK](kb/sources/govuk-dates.md)).
- קבלו יום וחודש חד-ספרתי; שנה דו-ספרתית → 20XX רק אם הגיוני (לידה: 19XX).
- בדקו תאריך אמיתי: `new Date(y, m-1, d)` והשוו רכיבים (31/02 נפסל).
- תאריך עתידי בתאריך לידה = שגיאה; גיל מחושב ומוצג מיד ("בן 34").
- תאריך עלייה: לא בעתיד, לא לפני 1948.
- **אל** תשתמשו ב-`<input type="date">` לתאריך לידה — ה-picker בנייד מציג
  לוח שנה שמתחיל היום, וקשה להגיע ל-1965.

## סכומים

- `inputmode="decimal"`, `type="text"`, `dir="ltr"`.
- קבלו `1,234.56`, `1234.56`, `1234,56` — אם יש גם פסיק וגם נקודה, האחרון
  הוא העשרוני.
- הציגו `1,234.56 ₪` ב-`blur`; אל תעגלו בשקט.
- שלילי: רק היכן שהטופס מאפשר (הכנסה שלילית לא; הפסד כן — לפי הסכימה).

## מספר תיק ניכויים (מעסיק)

9 ספרות שמתחילות ב-`9` (לפי flow/form-101-service). אותה בדיקת ספרת
ביקורת? **לא בהכרח** — אמתו מול הרשומה; אם לא, בדקו אורך+קידומת בלבד.

## מיקוד

7 ספרות. אופציונלי. אל תבדקו מול רשימת מיקודים — זו בדיקה שמייצרת כשלים
שווא.

## Do / Don't

| Do | Don't |
| --- | --- |
| ספרות בזמן הקלדה, פורמט ב-blur | מקף שנכנס אחרי כל תו ומזיז סמן |
| `padStart` לת"ז | למחוק אפסים מובילים |
| להציג את התאריך המפוענח | "תאריך לא תקין" בלבד |
| לקבל הדבקה | לחסום paste "מטעמי אבטחה" |
| `type="text" inputmode="numeric"` | `type="number"` לת"ז |
