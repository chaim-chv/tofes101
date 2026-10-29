---
id: ux/keyboard-model
title: מודל מקלדת — ניווט, קיצורים ומה אסור
type: decision
status: verified
confidence: verified
updated: 2026-10-29
tags: [keyboard, a11y, shortcuts, wcag, power-user]
sources: [source/w3c-wcag22, source/mdn-enterkeyhint]
related: [ux/focus-management, ux/checklists/keyboard-map, ux/signature-accessibility]
up: ux/ux-principles
---

# מודל מקלדת

## ההחלטה: שני מצבים, אפס קיצורי ברירת מחדל

| מצב | ברירת מחדל | מה זמין |
| --- | --- | --- |
| **ניווט טבעי** | תמיד דלוק | Tab / Shift+Tab / Enter / Space / חצים / Esc |
| **מצב מהיר** | כבוי, נדלק בהגדרה | מקש בודד: n, b, s, e, h, g, 1–9, 0, ? |

**למה אין קיצורי `Ctrl+Alt+…` גלובליים:** `Ctrl+Alt` הוא בדיוק מודיפייר
VoiceOver ב-macOS (`VO`), ו-`Insert`/`CapsLock` הם NVDA/JAWS. כל קיצור גלובלי
עם מודיפייר "סטנדרטי" גונב פקודה מקורא מסך. עדיף לא להציע מאשר לשבור.

**למה מצב מהיר כבוי:** WCAG 2.1.4 (A) מתיר קיצור של מקש בודד אם אפשר
לכבות, לשנות, או שהוא פעיל רק בפוקוס. כיבוי כברירת מחדל + מתג גלוי מקיים
את (א) ו-(ג) בו-זמנית, ולא מפריע לקורא מסך במצב עיון.

## ניווט טבעי (החוזה)

| מקש | פעולה | איפה |
| --- | --- | --- |
| `Tab` | לשדה/כפתור הבא לפי DOM | כל האתר |
| `Shift+Tab` | אחורה | כל האתר |
| `Enter` | שליחת הטופס → "המשך" (כפתור `type="submit"`) | בטופס |
| `Enter` ב-`textarea` | שורה חדשה | שדות ארוכים |
| `Enter` ברשימת השלמה פתוחה | בחירת האפשרות, **לא** מעבר שלב | combobox |
| `Space` | בחירת רדיו/צ'קבוקס, לחיצה על כפתור | רכיבים |
| `↑ ↓ ← →` | ניווט בתוך קבוצת רדיו / listbox / טאבים | רכיב מורכב |
| `Home` / `End` | ראשון/אחרון בקבוצה | רשימות |
| `Esc` | סגירת השכבה העליונה (דיאלוג/תפריט/גיליון) | overlay |
| `Esc` ללא overlay | **כלום** — לא לנטוש, לא למחוק | – |

- `Esc` לא יוצא מהטופס ולא מוחק טיוטה. יציאה = כפתור מפורש.
- `Enter` "מתקדם" הוא לא האזנה ידנית: זה submit רגיל של `<form>`. אל תוסיפו
  `keydown` שמזיז פוקוס ידנית.
- `Tab` לא נחטף. אין "focus trap" חוץ מאשר בדיאלוג מודאלי.

## מצב מהיר (מוצע, ליישום verbatim)

| מקש | פעולה | היכן פעיל | הערה |
| --- | --- | --- | --- |
| `n` | שלב הבא (אם תקין) | לא בשדה קלט | Next |
| `b` | שלב קודם | לא בשדה קלט | Back |
| `s` | שמירת טיוטה עכשיו | לא בשדה קלט | Save |
| `e` | ייצוא / תצוגת הדפסה | לא בשדה קלט | Export |
| `h` | פתיחת מרכז העזרה | לא בשדה קלט | Help |
| `g` | חיפוש במילון המונחים | לא בשדה קלט | Glossary |
| `1`–`9` | מעבר לשלב 1–9 | לא בשדה קלט | רק שלבים שהושלמו/נוכחי |
| `0` | מסך סקירה | לא בשדה קלט | Review |
| `?` | דיאלוג קיצורים | לא בשדה קלט | גם כפתור גלוי |

**"לא בשדה קלט"** = `event.target` אינו `input`, `textarea`, `select`,
`[contenteditable]`, ואין `[role="combobox"][aria-expanded="true"]`.
גם לא כשמקש מודיפייר לחוץ (Ctrl/Cmd/Alt).

```ts
const isTyping = (el: EventTarget | null) => {
  const n = el as HTMLElement | null
  return !!n?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
}
function onKey(e: KeyboardEvent) {
  if (!settings.quickKeys || e.ctrlKey || e.metaKey || e.altKey) return
  if (isTyping(e.target) || document.querySelector('[role="combobox"][aria-expanded="true"]')) return
  const map: Record<string, () => void> = {
    n: next, b: back, s: saveNow, e: exportPdf, h: openHelp, g: openGlossary,
    "?": openShortcuts, "0": goReview,
  }
  if (/^[1-9]$/.test(e.key)) { e.preventDefault(); jumpTo(Number(e.key)); return }
  const fn = map[e.key]
  if (fn) { e.preventDefault(); fn() }
}
```

- המתג: "קיצורי מקלדת מהירים" + קישור לטבלה. שומרים ב-localStorage.
- כשמדליקים: `announce("קיצורי מקלדת מהירים פעילים")`.
- הדיאלוג עצמו נגיש: `?` פותח, `Esc` סוגר, הטבלה נקראת.
- אין `accesskey` — הוא מתנגש עם קוראי מסך ולא ניתן לגילוי.

## חצים ב-RTL

- ברשימת שלבים אופקית: `→` = הפריט **הקודם**, `←` = הפריט **הבא**
  (APG: ב-RTL הכיוון החזותי מתהפך, הסדר הלוגי לא).
- ברדיוסים: הדפדפן מטפל; אל תמפו.
- בגרירת ילדים (2.5.7): חצים `↑/↓` מזיזים שורה, עם הכרזה "הועבר למקום 2 מתוך 3".

## קיצורים שלא נמפים

`Ctrl+C/V/X/Z/A`, `Ctrl+F`, `Ctrl+P`, `Ctrl+S`, `F5`, `F11`, `F12`,
`Ctrl+Tab`, `Ctrl+1..9`, `Alt+←/→`, `Alt+Home`, `Alt+D`, `Alt+F/E`.
אלה של הדפדפן/מערכת. אם משתמש לוחץ עליהם — שיקרה מה שהדפדפן עושה.

## Do / Don't

| Do | Don't |
| --- | --- |
| Tab order = DOM order | `tabindex="1..n"` |
| Enter = submit טבעי | `keydown` שמזיז פוקוס |
| Esc סוגר overlay | Esc מאבד טופס |
| מצב מהיר אופציונלי | `accesskey` |
| קיצור מתועד בדיאלוג | קיצור סודי |
