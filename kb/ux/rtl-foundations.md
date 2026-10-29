---
id: ux/rtl-foundations
title: RTL — תשתית, CSS לוגי ומה נשבר בפועל
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [rtl, css, hebrew, layout, a11y]
sources: [source/w3c-bidi-structural, source/w3c-wcag22]
related: [ux/bidi-mixed-content, ux/hebrew-typography, ux/mobile-layout]
up: ux/ux-principles
---

# RTL foundations

## הבסיס (3 שורות)

```html
<html lang="he" dir="rtl">
```

```css
:root { direction: rtl; }           /* לא חובה, אבל עוזב ל-gates */
.card { text-align: start; }
.btn  { margin-inline-start: .5rem; }
.icon { inset-inline-end: 0; }
```

- `dir` על `<html>` — לא על `body`, לא ב-CSS. כיוון הוא סמנטיקה, לא עיצוב
  ([מקור](../sources/w3c-bidi-structural.md)).
- `lang="he"` בנפרד; `dir` לא נגזר מ-`lang`.
- CSS לוגי בלבד: `margin-inline-*`, `padding-inline-*`, `inset-inline-*`,
  `border-inline-*`, `text-align: start|end`, `float: inline-start`.
- `left/right` נשארים רק לדברים שבאמת צריכים להיות פיזיים (למשל מיקוד מצלמה).

## מה מתהפך אוטומטית ומה לא

| מתהפך לבד | צריך טיפול |
| --- | --- |
| סדר עמודות בטבלה, יישור טקסט, פסיקים וסוגריים | אייקונים עם כיוון: חץ "הבא", שברון, אייקון "יציאה", לוגו |
| התחלת הקלדה בשדה מימין | אנימציות "slide" עם `translateX` |
| `flex-direction: row` (ויזואלית) | מדי התקדמות עם `background-position` |
| `text-align: right` כברירת מחדל | צללים/גרדיאנטים עם כיוון |

### אייקונים

- **חץ "המשך"** ב-RTL מצביע **שמאלה**. אל תהפכו את ה-`path`; השתמשו ב-
  `transform: scaleX(-1)` רק על אייקונים סימטריים-כיווניים, או ספקו שני נכסים.
- **אל תהפכו**: שעון, סרגל, אנשים, לוגו, סימני מותג, צ'ק-מרק, אייקון עין.
- חץ "חזרה" בדפוס RTL מצביע **ימינה**.

```css
[dir="rtl"] .icon-chevron-next { transform: scaleX(-1); }
```

### מד התקדמות

```html
<ol class="steps" dir="rtl">
  <li aria-current="step">פרטים אישיים</li>
  ...
</ol>
```
התקדמות חייבת להיות גם **טקסטואלית** ("שלב 3 מתוך 8") — לא רק פס צבע.

## מלכודות נפוצות

1. **`text-align: right` גלובלי** — שובר טקסט אנגלי, סכומים ומספרים.
   השתמשו ב-`start`.
2. **`margin-left` לקישור "עזרה"** — מתהפך לא נכון. `margin-inline-start`.
3. **`direction: ltr` על כל האתר** "כדי שהמספרים ייראו טוב" — הופך את כל
   חוויית הקריאה. מבודדים רק את המחרוזת החריגה.
4. **`unicode-bidi: bidi-override`** — כמעט תמיד שגוי; משתמשים ב-`dir`/`bdi`.
5. **גלילה אופקית** בגלל `width: 100vw` + פס גלילה — `1.4.10 Reflow`.
6. **`letter-spacing` שלילי** בעברית — פוגע בקריאות; אפס או חיובי קל.

## טבלאות ומספרים

- טבלת סכומים: `dir="ltr"` על תוכן מספרי בלבד, אבל הכותרת נשארת עברית.
- עמודת "שנה" וכותרות: `scope="col"`, וה-`<caption>` מספר מה הטבלה.
- אל תהפכו סדר עמודות ידנית — הדפדפן עושה את זה עם `dir="rtl"`.

## בדיקה מהירה

```js
// ב-console: כל אלמנט עם left/right פיזי
[...document.querySelectorAll('*')].filter(el => {
  const s = getComputedStyle(el);
  return ['left','right','marginLeft','marginRight','paddingLeft','paddingRight']
    .some(p => s[p] && s[p] !== '0px' && s[p] !== 'auto');
}).length
```

(התוצאה לעולם לא 0 בגלל ספריות; המטרה היא לדעת מה נשאר.)

## Do / Don't

| Do | Don't |
| --- | --- |
| `dir="rtl"` על `<html>` | `direction: rtl` על `body` |
| נכסים לוגיים | `margin-left/right` |
| להפוך רק אייקוני כיוון | להפוך לוגו או אייקון עין |
| טקסט + פס בהתקדמות | רק פס צבע |
