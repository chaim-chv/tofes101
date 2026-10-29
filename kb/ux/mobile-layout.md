---
id: ux/mobile-layout
title: מובייל — thumb zone, מקלדת וירטואלית ו-44px
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [mobile, ux, touch, viewport, a11y, responsive]
sources: [source/mdn-visual-viewport, source/mdn-inputmode, source/w3c-wcag22]
related: [ux/rtl-foundations, ux/focus-management, ux/validation-and-errors]
up: ux/ux-principles
---

# מובייל

רוב המשתמשים ימלאו בטלפון, בעמידה, עם יד אחת. זה משנה כל החלטה.

## גדלים

| יעד | מינימום | אצלנו |
| --- | --- | --- |
| יעד מגע | 24×24 (2.5.8 AA) | **44×44** CSS px |
| מרווח בין יעדים | – | 8px |
| טקסט בשדה | 16px (מונע zoom ב-iOS) | **18px** |
| כפתור ראשי | 44px גובה | 52px, רוחב מלא |

```css
.btn, .field input, .field select {
  min-block-size: 44px;
  font-size: 1.125rem;   /* 18px */
}
.btn--primary { min-block-size: 52px; inline-size: 100%; }
```

- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- **אל** תחנו `user-scalable=no` / `maximum-scale=1` — זו הפרה של 1.4.4.

## thumb zone

```
┌─────────────────┐
│  כותרת + התקדמות │  קריאה
│                 │
│  שדות           │  קריאה + הקלדה
│                 │
│  [ חזרה ]       │  משנית, נמוך
│  [ המשך ]       │  ראשית, תחתית, רוחב מלא
└─────────────────┘
```

- פעולה ראשית בתחתית — קרוב לאגודל.
- פעולה הרסנית (מחיקה/איפוס) **לא** ליד הראשית; עדיף למעלה או בתפריט.
- "חזרה" בפינה `inline-start` (ב-RTL: ימין) — אבל לא מתחת לאגודל accidentally.
- כפתור אחד ראשי למסך. שניים = בחירה, לא פעולה.

## סרגל פעולה דביק

```css
.actionbar {
  position: sticky;
  inset-block-end: 0;
  padding-block: 12px calc(12px + env(safe-area-inset-bottom));
  background: var(--surface);
  border-block-start: 1px solid var(--border);
}
```

- `env(safe-area-inset-bottom)` ל-iPhone עם Home indicator.
- **כשהמקלדת פתוחה — הסתירו אותו** (2.4.11). אחרת הוא מכסה את השדה.

```ts
const vv = window.visualViewport
const onResize = () => {
  const keyboard = window.innerHeight - (vv?.height ?? 0) > 150
  document.documentElement.toggleAttribute("data-keyboard", keyboard)
}
vv?.addEventListener("resize", onResize)
```

```css
[data-keyboard] .actionbar { display: none; }
```

- אין `position: fixed` לשדות או לסרגל מעל התוכן; `sticky` בטוח יותר.
- הוסיפו `scroll-margin-block-end: 120px` לשדות (→ [[ux/focus-management]]).

## מקלדות

| שדה | `inputmode` | הערה |
| --- | --- | --- |
| ת"ז, טלפון, מיקוד | `numeric` / `tel` | לא `type="number"` |
| סכום | `decimal` | נקודה עשרונית |
| אימייל | `email` | `@` במקלדת |
| חיפוש עיר | `text` | לא לחסום עברית |

- `enterkeyhint="next"` באמצע, `"go"` בסוף השלב.
- `autocorrect="off"` בשדות זהות.

## תאריכים

- **לא** `<input type="date">` לתאריך לידה: ה-picker מתחיל היום.
- שלושה שדות יום/חודש/שנה + `inputmode="numeric"`.
- לתאריך חתימה אפשר `<input type="date">` — קרוב להיום.

## טבלאות ומסמכים

- טבלת סכומים: הופכים לכרטיסים מתחת ל-600px, או גוללים אופקית **בתוך**
  אזור עם `role="region"` ו-`tabindex="0"` ותווית.
- PDF: לא להטמיע viewer כבד; כפתור הורדה + תצוגה מקדימה.

## בדיקות מובייל

1. iPhone SE (375×667) ו-Android קטן (360×640).
2. מקלדת פתוחה: השדה הממוקד נראה; הסרגל לא מכסה.
3. סיבוב מסך: אין נעילה, אין חיתוך.
4. 200% zoom: אין גלילה אופקית.
5. כפפה/אגודל: כל יעד לחיץ.

## Do / Don't

| Do | Don't |
| --- | --- |
| 44px, רוחב מלא | כפתור 32px "כדי שייכנס" |
| סרגל sticky שמתחבא | `fixed` שמכסה שדה |
| `inputmode` | `type="number"` לת"ז |
| `viewport-fit=cover` | `user-scalable=no` |
| עמודה אחת | שתי עמודות בנייד |
