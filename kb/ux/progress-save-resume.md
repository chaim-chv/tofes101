---
id: ux/progress-save-resume
title: התקדמות, שמירה אוטומטית ו"המשך מאוחר יותר" בלי שרת
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [ux, progress, autosave, draft, localstorage, offline]
sources: [source/govuk-question-pages, source/w3c-wcag22]
related: [ux/wizard-vs-long-page, ux/trust-local-privacy, ux/mobile-layout]
up: ux/wizard-vs-long-page
---

# התקדמות ושמירה

## התקדמות

```html
<nav aria-label="שלבי הטופס">
  <ol class="steps">
    <li><a href="/step/1">שנת מס ומעסיק</a></li>
    <li><a href="/step/2" aria-current="step">פרטים אישיים</a></li>
    <li><span aria-disabled="true">מגורים</span></li>
  </ol>
  <p class="steps__count">שלב 2 מתוך 8</p>
</nav>
```

- **טקסט**, לא רק פס: "שלב 2 מתוך 8 · פרטים אישיים".
- מבוסס **שלבים**, לא אחוזי שדות. אחוזים קופצים אחורה כשמופיעים שדות
  תלויים — זה מתסכל ומייצר תחושת כישלון.
- שלבים שהושלמו: קישור. שלב נוכחי: `aria-current="step"`. שלבים עתידיים:
  `aria-disabled` + הסבר, לא סתם אפור.
- אין אנימציית "מילוי" שמסתובבת; אם יש, `prefers-reduced-motion`.

## שמירה אוטומטית

```ts
// debounce 400ms + שמירה מיידית באירועי מפתח
const KEY = "tofes101:draft:v3"
type Draft = { schema: 3; savedAt: string; step: number; answers: Record<string, unknown> }

function save(d: Draft) {
  try { localStorage.setItem(KEY, JSON.stringify(d)) }
  catch (e) { /* QuotaExceeded → IndexedDB או הודעה */ }
}
addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveNow()
})
```

- שמרו ב-`input` (debounced), ב-`change`, לפני מעבר שלב, וב-`pagehide`.
- **localStorage** לערכים; **IndexedDB** לקובץ חתימה (strokes) או תמונות —
  `localStorage` מוגבל ל~5MB לכל origin.
- מפתח עם **גרסת סכימה**. טעינה של גרסה ישנה = מיגרציה או הודעה, לא איפוס.
- `savedAt` מוצג: "נשמר אוטומטית ב-14:32".

## "המשך מאוחר יותר"

בלי שרת יש שתי דרכים, ושתיהן חייבות להיות מוסברות:

1. **אותו דפדפן, אותו מכשיר** — הטיוטה נשמרת אוטומטית. קישור `?resume=1`
   לא נושא את הנתונים; הוא רק מנווט. אל תבטיחו "קישור שעובד מהטלפון".
2. **קובץ טיוטה** — "הורדת טיוטה" (JSON) + "טעינת טיוטה". זה המסלול היחיד
   בין מכשירים בלי שרת. הקובץ מכיל נתונים אישיים — צריך אזהרה מפורשת.

```html
<button type="button" data-action="export-draft">הורדת טיוטה לקובץ</button>
<label class="file">
  טעינת טיוטה
  <input type="file" accept="application/json,.json">
</label>
```

- שם קובץ: `tofes101-draft-2026-10-29.json` (לא לכלול ת"ז בשם).
- טעינה: מאמתים סכימה, מציגים תאריך ושם (ממוסך חלקית), מבקשים אישור.

## זיהוי טיוטה בכניסה

```html
<section aria-labelledby="resume-h">
  <h2 id="resume-h">מצאנו טיוטה מהמכשיר הזה</h2>
  <p>נשמרה ב-29.10.2026 בשעה 14:32, בשלב "מגורים".</p>
  <button>המשך מהטיוטה</button>
  <button>התחל טופס חדש</button>
</section>
```

- הציגו **מינימום מידע אישי** במסך הזה — מכשיר משותף.
- "התחל חדש" לא מוחק את הטיוטה עד אישור שני.

## אזהרות שצריך להראות (במקום הנכון)

| מצב | הודעה |
| --- | --- |
| מצב פרטי/גלישה בסתר | "במצב פרטי ייתכן שהטיוטה לא תישמר לאחר סגירת הדפדפן." |
| ניקוי נתונים | "ניקוי היסטוריה/אתר בדפדפן ימחק את הטיוטה." |
| מכשיר משותף | "במחשב משותף, הורידו את הטיוטה ומחקו אותה בסיום." |
| חריגה ממכסת אחסון | "לא הצלחנו לשמור אוטומטית. הורידו טיוטה כדי לא לאבד נתונים." |

## Do / Don't

| Do | Don't |
| --- | --- |
| "שלב 3 מתוך 8" | "60% הושלם" |
| שמירה לפני ניווט | שמירה רק ב"שמור" |
| קובץ טיוטה בין מכשירים | להבטיח סנכרון שאין |
| אזהרה על מצב פרטי | להסתיר שהטיוטה מקומית |
| מיגרציית סכימה | לאפס טיוטה בשקט |
