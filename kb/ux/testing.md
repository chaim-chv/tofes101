---
id: ux/testing
title: בדיקות נגישות — מקלדת, קוראי מסך, CI ו-DoD
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [a11y, testing, screen-reader, ci, checklist]
sources: [source/w3c-wcag22, source/govuk-error-summary]
related: [ux/checklists/a11y-pr-checklist, ux/checklists/screen-review-checklist, ux/keyboard-model]
up: ux/ux-principles
---

# בדיקות

## 1. מקלדת בלבד (5 דקות, כל PR)

- [ ] מנתקים עכבר. מסיימים שלב שלם.
- [ ] `Tab` מגיע לכל רכיב; הסדר הגיוני ב-RTL.
- [ ] הפוקוס נראה בכל רגע (גם על רקע כהה/תמונה).
- [ ] אין מלכודת פוקוס; `Esc` סוגר overlay ומחזיר פוקוס.
- [ ] `Enter` מפעיל "המשך"; `Space` בוחר; חצים ברדיוסים.
- [ ] קישורי הדילוג עובדים ומופיעים בפוקוס.
- [ ] אפשר לחתום בלי עכבר.

## 2. קורא מסך — מטריצה מינימלית

| פלטפורמה | קורא | דפדפן | מה בודקים |
| --- | --- | --- | --- |
| Windows | NVDA (חינם) | Firefox + Chrome | טפסים, live regions, טבלאות |
| Windows | JAWS | Chrome | אותה בדיקה; JAWS שונה בהכרזות |
| macOS | VoiceOver | Safari | `Ctrl+Option` לא נחטף |
| iOS | VoiceOver | Safari | מקלדת וירטואלית, roving tabindex |
| Android | TalkBack | Chrome | טפסים, כפתורים |

**עברית:** הפעילו קול עברי (Carmit ב-Apple, Asaf/Microsoft ב-Windows).
בדקו במיוחד:
- ת"ז וטלפון — האם נקראים ספרה-ספרה.
- מילים באנגלית — האם עוברות להגייה אנגלית (צריך `lang="en"`).
- טופס עם כיוון RTL — האם סדר הקריאה הגיוני.

### תסריט בדיקה (10 דקות)

1. טעינת עמוד הבית: מה מוכרז ראשון?
2. מעבר לשלב 2: מוכרז "שלב 2 מתוך 8"?
3. שליחת שלב עם 2 שגיאות: פוקוס לסיכום? וכל קישור מוביל לשדה?
4. שדה עם שגיאה: `aria-invalid` + תיאור מוכרזים?
5. שינוי "מצב משפחתי" ל"נשוי": מוכרז שנוספו שדות?
6. חתימה: אפשר להגיע למסלול ההקלדה?
7. מעבר שלב: הכותרת מוקראת, לא השדה הראשון.
8. `Esc` בדיאלוג: סגירה והחזרת פוקוס.

## 3. אוטומטי

```bash
npx @axe-core/cli http://localhost:3000 --exit
npx lighthouse http://localhost:3000 --only-categories=accessibility --chrome-flags="--headless"
```

```ts
// Playwright + axe — לכל שלב
import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

for (const step of ["1","2","3","4","5","6","7","review"]) {
  test(`a11y step ${step}`, async ({ page }) => {
    await page.goto(`/step/${step}`)
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"])
      .analyze()
    expect(r.violations).toEqual([])
  })
}
```

**axe תופס ~30–50%** מהבעיות. הוא לא תופס: סדר פוקוס שגוי, טקסט לא ברור,
הודעת שגיאה לא מובנת, RTL שבור, קורא מסך שמקריא שטויות. לכן ידני חובה.

בדיקות יחידה שכדאי להוסיף:
- לכל `<input>` יש `<label for>` או `aria-label`.
- אין `id` כפול.
- לכל שדה מידע אישי יש `autocomplete` חוקי (או `off` מוסבר).
- אין `tabindex` חיובי.
- כל `<img>` עם `alt` (או `alt=""`).

## 4. רזולוציה וויזואל

- 320px רוחב, 400% zoom: אין גלילה אופקית (1.4.10).
- 200% טקסט: אין חיתוך (1.4.4).
- Text spacing bookmarklet (1.4.12).
- Windows High Contrast / `forced-colors`: גבולות ו-focus נראים.
- `prefers-reduced-motion`: אנימציות כבויות.
- ניגודיות: 4.5:1 טקסט, 3:1 רכיבים, 3:1 focus.

## 5. Definition of Done (להדביק ב-PR)

```md
## Accessibility
- [ ] keyboard-only: completes the step, no trap, visible focus
- [ ] SR pass (NVDA or VoiceOver) on the changed screen
- [ ] labels + autocomplete tokens + inputmode correct
- [ ] error summary: focus moves, links focus the field
- [ ] no new axe serious/critical
- [ ] 320px / 200% / RTL visual check
- [ ] Hebrew read aloud: numbers and Latin text sound right
```

## 6. מתי בודקים מה

| שלב | בדיקה |
| --- | --- |
| עיצוב | ניגודיות, גדלים, RTL, מצבי שגיאה |
| פיתוח רכיב | מקלדת + axe + DOM semantics |
| לפני merge | צ'קליסט PR |
| לפני שחרור | מעבר מלא במקלדת + 2 קוראי מסך |
| רבעוני | בדיקת 10 מסכים + עדכון הצהרה |

## Do / Don't

| Do | Don't |
| --- | --- |
| לבדוק עם עכבר מנותק | "זה עובד בעכבר" |
| NVDA + VoiceOver לפחות | רק Lighthouse |
| תסריט קבוע | "נראה בסדר" |
| לתעד חריגים | להתעלם מ"ידוע" |
