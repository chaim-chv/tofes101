---
id: ux/focus-management
title: ניהול פוקוס — סדר, טבעת, דיאלוגים ודביקים
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [a11y, focus, keyboard, wcag, dialog]
sources: [source/w3c-wcag22]
related: [ux/keyboard-model, ux/validation-and-errors, ux/mobile-layout]
up: ux/ux-principles
---

# ניהול פוקוס

## כללים

1. **סדר הפוקוס = סדר ה-DOM.** ב-RTL, הדפדפן הופך את הכיוון החזותי אבל
   לא את ה-DOM. אל "תתקנו" עם `tabindex` חיובי.
2. **פוקוס תמיד נראה.** `:focus-visible` עם טבעת 2px לפחות, ניגוד 3:1 מול
   הרקע וה"מנוחה" (2.4.7; 2.4.13 מומלץ).
3. **פוקוס לא מוסתר.** כותרת דביקה/סרגל תחתון לא מכסים את הרכיב (2.4.11).
4. **אף פעם לא `outline: none`** בלי חלופה.

```css
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 2px;
  border-radius: 4px;
}
html { scroll-padding-block: 96px 120px; } /* header + sticky action */
```

## דביקים (sticky)

- סרגל פעולה תחתון: `position: sticky; bottom: 0` + `padding-block-end: env(safe-area-inset-bottom)`.
- הוסיפו `scroll-margin-block-end: 120px` לכל שדה, אחרת הפוקוס "נבלע".
- כשהמקלדת הווירטואלית פתוחה — הסתירו את הסרגל (**2.4.11**).
  → [[ux/mobile-layout]]
- בדיקה: Tab עד הסוף בנייד; כל שדה נראה לפחות חלקית.

## מעבר שלב

```ts
async function goToStep(n: number) {
  await router.push(`/step/${n}`)
  await nextTick()
  const h1 = document.querySelector("h1")
  h1?.setAttribute("tabindex", "-1")
  h1?.focus({ preventScroll: true })
  window.scrollTo({ top: 0, behavior: "instant" })
  announce(`שלב ${n} מתוך ${TOTAL}: ${title}`)
}
```

- `tabindex="-1"` על הכותרת — לא על `body`.
- `preventScroll` + גלילה מפורשת, אחרת הדפדפן גולל למקום מוזר.
- **לא** להעביר פוקוס לשדה הראשון אוטומטית: קורא המסך מפספס את הכותרת
  וההינט.
- חזרה אחורה (Back button) — אותו טיפול, כי גם אז הדף "מתחלף".

## דיאלוגים

```html
<dialog id="help" aria-labelledby="help-h">
  <h2 id="help-h">מילון מונחים</h2>
  ...
  <button type="button" data-close>סגירה</button>
</dialog>
```

```ts
dialog.showModal()            // focus trap + Esc בחינם
// בפתיחה: focus לכותרת או לשדה החיפוש
// בסגירה: focus חזרה לכפתור שפתח
```

- `showModal()` נותן `aria-modal`, trapping ו-`Esc` — אל תבנו לבד.
- אם בונים לבד: `role="dialog" aria-modal="true"`, פוקוס ראשוני,
  לוכדים Tab, מחזירים פוקוס.
- `Esc` סוגר **השכבה העליונה**; אם יש toast — לא.
- דיאלוג לא נפתח אוטומטית באמצע הקלדה.

## פוקוס אחרי שינוי תוכן

| פעולה | לאן עובר הפוקוס |
| --- | --- |
| הוספת שורת ילד | לשדה "שם הילד" בשורה החדשה |
| מחיקת שורה | לשורת "מחיקה" הבאה, או לכפתור "הוספה" |
| שגיאה ב-submit | לכותרת סיכום השגיאות |
| שדות חדשים בגלל בחירה | **נשאר במקום**, רק הכרזה |
| סגירת overlay | לרכיב שפתח |
| שמירה אוטומטית | **לא זז** |

## קישורי דילוג

```html
<a class="skip" href="#main">דלג לתוכן</a>
<a class="skip" href="#steps">דלג לשלבי הטופס</a>
<a class="skip" href="#primary-action">דלג לפעולה הראשית</a>
```

```css
.skip { position: absolute; inset-block-start: -100px; }
.skip:focus { inset-block-start: 8px; inset-inline-start: 8px; z-index: 100; }
```

- ראשון ב-DOM. מופיע בפוקוס בלבד.
- ה-`<main id="main" tabindex="-1">` כדי שהפוקוס באמת יעבור.

## Do / Don't

| Do | Don't |
| --- | --- |
| `focus-visible` גלוי | `outline: none` |
| פוקוס ל-`h1` במעבר | פוקוס לשדה הראשון |
| `scroll-margin` לדביקים | סרגל שמכסה שדה |
| `showModal()` | `div` עם `aria-modal` בלבד |
| החזרת פוקוס | פוקוס שנעלם ל-`body` |
