---
id: ux/choice-controls
title: רדיו, צ'קבוקס ומתג ב-RTL — סמנטיקה ובחירות
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [forms, radio, checkbox, switch, rtl, a11y]
sources: [source/w3c-wcag22, source/govuk-question-pages]
related: [ux/required-optional-conditional, ux/keyboard-model, ux/validation-and-errors]
up: ux/ux-principles
---

# רכיבי בחירה

## מתי מה

| מצב | רכיב |
| --- | --- |
| 2–5 אפשרויות, בחירה אחת | **radio** |
| 6+ אפשרויות, בחירה אחת | `select` (עם תווית!) או radio אם המקום מאפשר |
| כן/לא | radio או צ'קבוקס בודד — **לא** switch בטופס |
| כמה אפשרויות | checkbox |
| הפעלה מיידית של הגדרה | switch (`role="switch"`) |

**מתג לא לשימוש בשאלות טופס.** "האם אתה תושב ישראל?" עם מתג נראה כמו
הגדרה, לא כמו הצהרה משפטית. הצ'קבוקס/רדיו הוא הסטנדרט.

## רדיו — מבנה

```html
<fieldset class="fieldset" aria-describedby="sex-hint">
  <legend>מין</legend>
  <p id="sex-hint" class="hint">נדרש לחישוב נקודות זיכוי ולניסוח הפנייה.</p>

  <div class="radio">
    <input type="radio" id="sex-f" name="sex" value="f" required>
    <label for="sex-f">נקבה</label>
  </div>
  <div class="radio">
    <input type="radio" id="sex-m" name="sex" value="m">
    <label for="sex-m">זכר</label>
  </div>
</fieldset>
```

- `fieldset` + `legend` — לא `div role="radiogroup"` אלא אם אין ברירה.
- אותו `name` לכל הקבוצה → ניווט בחצים עובד מהדפדפן.
- התווית עוטפת או `for`; אל תלחצו על `div`.
- ה-`legend` הוא השאלה; אל תחזרו עליה בתוויות ("מין: נקבה" מיותר).

## RTL וחצים

- בדפדפן, חצים שמאלה/ימינה עוברים בין רדיוסים לפי **סדר ה-DOM**, לא לפי
  המיקום החזותי. ב-RTL הפריט הראשון הוא הימני ביותר.
- **אל** תוסיפו מקשי חצים משלכם. זה שובר התנהגות צפויה.
- אם בונים רשימה אופקית (chips), סדר ה-DOM חייב להיות סדר הקריאה מימין
  לשמאל; אל תהפכו עם `flex-direction: row-reverse` בלי לתקן את ה-DOM.
- `space` בוחר; `Enter` שולח את הטופס. אל תמפו `Enter` לבחירה.

## צ'קבוקס

```html
<div class="checkbox">
  <input type="checkbox" id="kibbutz" name="kibbutz" value="1">
  <label for="kibbutz">חבר/ה בקיבוץ או מושב שיתופי</label>
</div>
```

- תווית אחת לכל צ'קבוקס, גם אם הן ברשימה.
- "בחר הכול" — רק אם יש 8+ אפשרויות, והוא צריך לעדכן `indeterminate`.
- צ'קבוקס שמפעיל שדה נוסף: השדה מופיע **מיד אחריו** ומוכרז
  (→ [[ux/required-optional-conditional]]).

## "אף אחד מהאפשרויות"

- אם יש "אחר" — הוסיפו שדה טקסט מסונכרן, לא רק אופציה.
- אם אף אפשרות לא מתאימה (למשל קופת חולים): הוסיפו "אחרת" + טקסט.
- "לא יודע/ת" היא תשובה לגיטימית כשהיא לא משנה תוצאה; אם היא משנה — חייבת
  להיות אפשרות אמיתית עם השלכה מוסברת.
- אל תכריחו בחירה מתוך רשימה שאינה מכסה את המציאות.

## שגיאה ברמת קבוצה

```html
<fieldset aria-describedby="sex-error" aria-invalid="true">
  ...
  <p id="sex-error" class="error">בחרו מין — הוא נדרש לחישוב נקודות הזיכוי.</p>
</fieldset>
```

- `aria-invalid` על ה-`fieldset`, לא על כל רדיו בנפרד.
- קישור מסיכום השגיאות ממוקד ל**רדיוס הראשון**, לא ל-`fieldset`.

## Do / Don't

| Do | Don't |
| --- | --- |
| `fieldset`/`legend` | `div` עם קליק |
| רדיו ל-2–5 אפשרויות | `select` עם 3 אפשרויות |
| `name` משותף | `name` שונה לכל רדיו |
| "אחרת" + טקסט | רשימה סגורה שלא מכסה |
| מקלדת מקורית | מפוי חצים משלכם |
