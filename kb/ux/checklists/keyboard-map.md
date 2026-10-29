---
id: ux/checklists/keyboard-map
title: מפת מקלדת — הטבלה המחייבת
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [keyboard, shortcuts, a11y, rtl, spec]
sources: [source/w3c-wcag22, source/mdn-enterkeyhint]
related: [ux/keyboard-model, ux/focus-management, ux/testing]
up: ux/keyboard-model
---

# מפת מקלדת

מפת הקיצורים המוצעת, ליישום verbatim. שני מצבים: **ניווט טבעי** (תמיד)
ו**מצב מהיר** (אופציונלי, כבוי כברירת מחדל).

## מצב 1 — ניווט טבעי (חובה, אין מה להטמיע מעבר ל-HTML נכון)

| מקש | פעולה | היכן | התנהגות |
| --- | --- | --- | --- |
| `Tab` | רכיב הבא | כל האתר | סדר DOM; ב-RTL עדיין DOM order |
| `Shift+Tab` | רכיב קודם | כל האתר | – |
| `Enter` | שליחת `<form>` → "המשך" | שלב טופס | native submit, לא keydown handler |
| `Enter` | שורה חדשה | `textarea` | – |
| `Enter` | בחירת אפשרות | combobox פתוח | לא לקדם שלב |
| `Space` | בחירה/לחיצה | radio, checkbox, button | – |
| `↑`/`↓` | פריט קודם/הבא | listbox, תפריט, רדיו אנכי | – |
| `→` | **פריט קודם** | רשימה אופקית ב-RTL | הכיוון החזותי מתהפך |
| `←` | **פריט הבא** | רשימה אופקית ב-RTL | – |
| `Home`/`End` | ראשון/אחרון | קבוצה | – |
| `Esc` | סגירת השכבה העליונה | dialog/menu/sheet | מחזיר פוקוס לפותח |
| `Esc` | כלום | ללא overlay | לא לנטוש/למחוק |
| `Ctrl+C/V/X/Z/A` | native | שדות | לא למפות מחדש |

**אסור:** `accesskey`, `tabindex>0`, לכידת `Tab`, לכידת `Enter` בתוך
`textarea`, קיצור שמבטל `Ctrl+F`.

## מצב 2 — מהיר (אופציונלי, ברירת מחדל כבויה)

מתג: "קיצורי מקלדת מהירים" (Settings / תפריט נגישות). נשמר מקומית.

| מקש | פעולה | היכן פעיל | הערות |
| --- | --- | --- | --- |
| `n` | שלב הבא | לא בשדה קלט | אם השלב לא תקין — מציג שגיאות, לא מדלג |
| `b` | שלב קודם | לא בשדה קלט | תמיד |
| `s` | שמירת טיוטה | לא בשדה קלט | מציג "נשמר" |
| `e` | תצוגה מקדימה / ייצוא | לא בשדה קלט | פותח מסך, לא מוריד מיד |
| `h` | מרכז עזרה | לא בשדה קלט | – |
| `g` | חיפוש במילון | לא בשדה קלט | פוקוס לשדה החיפוש |
| `?` | דיאלוג קיצורים | לא בשדה קלט | מקש `Shift+/` |
| `1`–`9` | מעבר לשלב 1–9 | לא בשדה קלט | רק שלב שהושלם/נוכחי |
| `0` | סקירה | לא בשדה קלט | – |
| `Esc` | סגירת דיאלוג הקיצורים | דיאלוג | – |

**"לא בשדה קלט"** = אין פוקוס ב-`input`, `textarea`, `select`,
`[contenteditable]`, `[role="textbox"]`, ואין combobox פתוח. גם לא עם
`Ctrl`/`Cmd`/`Alt` לחוץ.

```ts
const inEditor = (t: EventTarget | null) =>
  !!(t as HTMLElement)?.closest(
    'input, textarea, select, [contenteditable="true"], [role="textbox"]'
  )
const comboOpen = () =>
  !!document.querySelector('[role="combobox"][aria-expanded="true"]')

document.addEventListener("keydown", (e) => {
  if (!quickKeys || e.ctrlKey || e.metaKey || e.altKey) return
  if (inEditor(e.target) || comboOpen()) return

  if (/^[1-9]$/.test(e.key)) { e.preventDefault(); jumpTo(+e.key); return }
  if (e.key === "0") { e.preventDefault(); review(); return }

  const actions: Record<string, () => void> = {
    n: next, b: back, s: saveNow, e: exportPdf,
    h: help, g: glossary, "?": shortcuts,
  }
  const fn = actions[e.key]
  if (fn) { e.preventDefault(); fn() }
})
```

## למה לא `Ctrl+Alt+…`

| מתחרה | מה הוא תופס |
| --- | --- |
| VoiceOver (macOS/iOS) | `Ctrl+Option` = `VO` לכל פקודה |
| NVDA | `Insert` / `CapsLock` כמודיפייר |
| JAWS | `Insert` + מקשים |
| Chrome | `Ctrl+Shift+N/T/I/J`, `Alt+←/→/D/E/F`, `Ctrl+1..9` |
| Firefox | `Alt+1..9` (טאבים), `Alt+D`, `Alt+Home` |
| Windows | `Alt+Shift` = החלפת פריסה; `Ctrl+Alt+Arrow` = סיבוב מסך בחלק מהמחשבים |

לכן: **אפס קיצורים גלובליים עם מודיפייר** כברירת מחדל.

## חצים ב-RTL — דוגמה

```
[ שלב 1 ] [ שלב 2 ] [ שלב 3* ]
   ↑          ↑         ↑
  שמאל       אמצע      ימין      (חזותי)
  הראשון     השני      השלישי    (לוגי)

→  = שלב 1 (הקודם)
←  = שלב 3 (הבא)
```

## בדיקות חובה למפת המקלדת

- [ ] `Tab` מגיע לכל רכיב בפעם הראשונה; אין "חור" פוקוס.
- [ ] `Shift+Tab` חוזר באותו מסלול.
- [ ] `Enter` בשדה טקסט שולח את השלב (לא מוסיף שורה).
- [ ] `Enter` ב-`textarea` מוסיף שורה.
- [ ] `Enter` ב-combobox בוחר אפשרות.
- [ ] `Esc` בדיאלוג סוגר ומחזיר פוקוס.
- [ ] `Esc` מחוץ לדיאלוג לא עושה כלום.
- [ ] מצב מהיר כבוי: `n` בתוך שדה מקליד "נ", לא מנווט.
- [ ] מצב מהיר דלוק: `n` מחוץ לשדה מנווט; בתוך שדה מקליד.
- [ ] VoiceOver: `Ctrl+Option+…` לא נתפס על ידינו.
- [ ] אחרי מעבר שלב: פוקוס על `h1`, לא על השדה.
- [ ] קישור "דלג לתוכן" ראשון ב-Tab.

## תיעוד למשתמש

דיאלוג הקיצורים מציג את הטבלה **בעברית**, עם העמודה "היכן זה עובד".
כפתור "כיבוי קיצורים" בתוך הדיאלוג. אין קיצור סודי.
