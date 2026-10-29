---
id: ux/live-announcements
title: הכרזות ל-aria-live — מה, מתי ואיך לא להציף
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [a11y, aria-live, screen-reader, status, forms]
sources: [source/w3c-wcag22, source/govuk-error-summary]
related: [ux/validation-and-errors, ux/required-optional-conditional, ux/signature-accessibility]
up: ux/ux-principles
---

# הכרזות

## מתי להכריז

| אירוע | כן/לא | איך |
| --- | --- | --- |
| שגיאה אחרי submit | **לא** derיכה live | פוקוס לסיכום (`role="alert"` על הסיכום) |
| שדות חדשים בגלל בחירה | **כן** | `role="status"` "נוספו שדות…" |
| שמירה אוטומטית | **כן, במשורה** | פעם ב-15–30 שניות, לא בכל הקלדה |
| שלב הוחלף | **כן** | "שלב 3 מתוך 8: מגורים" |
| חתימה נרשמה | **כן** | "החתימה נרשמה. עברו לאישור." |
| העתקת כתובת | **כן** | "הכתובת הועתקה" |
| ספירת תווים | **לא** (או `polite` רק ב-90%) | – |
| "נטען…" מתמשך | **לא** | `aria-busy` על האזור |

## התבנית

```html
<div id="sr-status" role="status" aria-live="polite" aria-atomic="true"
     class="visually-hidden"></div>
```

```ts
let t: number
export function announce(msg: string) {
  const el = document.getElementById("sr-status")!
  clearTimeout(t)
  el.textContent = ""                 // איפוס כדי שאותו טקסט יוכרז שוב
  t = setTimeout(() => { el.textContent = msg }, 100)
}
```

- **אזור אחד** לכל האפליקציה. כמה אזורים = הכרזות כפולות.
- `aria-atomic="true"` — הקריא את השלם, לא רק את ההפרש.
- `visually-hidden` — לא `display:none` (אז לא מוכרז).
- `assertive` רק לסכנה מיידית (פג תוקף, אובדן נתונים). אחרת `polite`.

## מה לא להכריז

- כל הקלדה ("נשמר, נשמר, נשמר") — מציף ומבטל את הקריאה של המשתמש.
- את תוכן השדה שהמשתמש מקליד — קורא המסך כבר מקריא.
- הודעת שגיאה *בנוסף* לפוקוס לסיכום — הכרזה כפולה.
- "הטופס נשלח" לפני שזה קרה באמת.

## שלב חדש = שני אירועים

1. `<h1>` מקבל פוקוס (`tabindex="-1"`) — הקורא מקריא את הכותרת.
2. `announce("שלב 3 מתוך 8: מגורים")` — הקשר.

אם גם ה-route מוכרז על ידי ה-framework (Nuxt/Next), כבו הכרזה אוטומטית
כפולה; בדקו עם NVDA).

## טיימרים

- טופס 101 אינו אמור לפקוע. אם יש טיימר (למשל "טיוטה תישמר ל-30 יום") —
  זה מידע, לא ספירה לאחור.
- אם בכל זאת יש פקיעת תוקף: התראה ב-`assertive` + אפשרות להאריך (2.2.1).

## Do / Don't

| Do | Don't |
| --- | --- |
| אזור `status` אחד | `aria-live` על כל שדה |
| הודעה קצרה ומדויקת | "משהו השתנה" |
| איפוס לפני הכרזה חוזרת | טקסט זהה שלא מוכרז |
| `aria-busy` לטעינה | "טוען…" בלופ |
