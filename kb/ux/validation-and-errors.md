---
id: ux/validation-and-errors
title: ולידציה, סיכום שגיאות וניהול פוקוס
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [forms, validation, errors, a11y, focus, wcag]
sources: [source/govuk-error-summary, source/nng-web-form-design, source/w3c-wcag22]
related: [ux/live-announcements, ux/israeli-input-masking, ux/hebrew-microcopy]
up: ux/ux-principles
---

# ולידציה ושגיאות

## מתי

| מתי | מה |
| --- | --- |
| בזמן הקלדה | **כלום**. אולי הצגת מונה תווים. |
| ב-`blur`, אם השדה אינו ריק | שגיאת **פורמט** ("ת"ז חייבת 9 ספרות") |
| ב-`blur`, אם ריק | **לא** "שדה חובה" — זה מוקדם ומטריד |
| ב"המשך" / "שלח" | הכול: חובה, פורמט, תלות בין שדות |
| אחרי שגיאה, בזמן תיקון | בדיקה חוזרת ב-`input`, אבל בלי להבהב |

## סיכום שגיאות (חובה)

```html
<div class="error-summary" role="alert" aria-labelledby="err-h" tabindex="-1" ref="summary">
  <h2 id="err-h">יש 3 בעיות בטופס</h2>
  <ul>
    <li><a href="#id">תעודת זהות: חסרה ספרה</a></li>
    <li><a href="#phone">טלפון: מספר לא תקין</a></li>
    <li><a href="#bday">תאריך לידה: התאריך 31/02/2026 אינו קיים</a></li>
  </ul>
</div>
```

- ממוקם **מעל** ה-`<h1>` (או מיד אחריו), לא בתחתית.
- אחרי submit: `summary.focus()` (יש `tabindex="-1"`), לא `scrollTo`.
- כל קישור: **מזיז פוקוס** לשדה (`el.focus()`), לא רק גולל.
- כותרת העמוד מתעדכנת: `שגיאה: טופס 101 — פרטים אישיים`.
- `role="alert"` כאן **כן** מתאים: זו הודעה חד-פעמית אחרי פעולה. אין
  להוסיף `aria-live` כפול.

## שגיאה בשדה

```html
<div class="field field--error">
  <label for="id">תעודת זהות</label>
  <p id="id-hint" class="hint">9 ספרות, כולל ספרת ביקורת</p>
  <p id="id-error" class="error">
    <span class="visually-hidden">שגיאה: </span>
    תעודת הזהות חסרה ספרה. הזינו 9 ספרות.
  </p>
  <input id="id" name="nationalId" type="text" dir="ltr"
         inputmode="numeric" autocomplete="off"
         aria-invalid="true"
         aria-describedby="id-hint id-error">
</div>
```

- `aria-invalid="true"` רק אחרי שהוצגה שגיאה, ומתאפס כשהשדה תקין.
- `aria-describedby` כולל **גם** את ההינט וגם את השגיאה — לא מחליף.
- גבול אדום + אייקון + טקסט. צבע לבדו אסור (1.4.1).
- `aria-errormessage` קיים אבל תמיכת קוראי מסך חלקית; `aria-describedby`
  הוא ברירת המחדל הבטוחה.

## אל תשמידו נתונים

- אסור `form.reset()` אחרי שגיאה.
- אסור לרוקן שדה "כי הוא לא תקין".
- אם משתמש עבר שלב ואז חזר — כל התשובות שם.
- אם ולידציה של שלב נכשלת, **לא** משנים את השלב; נשארים ומסמנים.

## כפתור שליחה

- **לא מושבת** כשאין חתימה/שדה חסר. כפתור מושבת הוא היעדר מידע.
  ([field/101-signature](../field/101-signature.md) אומר את אותו דבר.)
- אם בכל זאת צריך למנוע כפילות שליחה: `loading` + `aria-busy`, לא `disabled`
  בלי הסבר.

## נוסחאות הודעה (עברית)

| מצב | נוסחה | דוגמה |
| --- | --- | --- |
| חסר | "חסר/ה <מה>. <מה לעשות>." | "חסר מספר טלפון. הזינו נייד או טלפון קווי." |
| פורמט | "<מה> צריך/ה להכיל <כלל>." | "תעודת זהות צריכה להכיל 9 ספרות." |
| טווח | "<מה> חייב/ת להיות בין <א> ל-<ב>." | "שנת לידה חייבת להיות בין 1900 ל-2026." |
| לא קיים | "<הערך> אינו/ה <סוג> תקין/ה." | "התאריך 31/02/2026 אינו תאריך קיים." |
| תלות | "כדי <פעולה>, <דרישה>." | "כדי לדווח על בן/בת זוג, בחרו מצב משפחתי 'נשוי/אה'." |

- פועל בהווה/ציווי רך, לא "שגיאה!" ולא "לא תקין".
- לא להאשים: לא "הזנת שגוי" אלא "המספר חסר ספרה".
- לא לחזור על אותו טקסט בהינט ובשגיאה.

## סדר פעולות ב-submit

```ts
async function onSubmit() {
  const errors = validateAll()
  if (errors.length) {
    renderSummary(errors)          // ממלא DOM
    await nextTick()
    summary.focus()                // פוקוס לכותרת הסיכום
    announce(`${errors.length} בעיות בטופס`) // אופציונלי, role=alert כבר מכריז
    return
  }
  await saveAndContinue()
}
```

## Do / Don't

| Do | Don't |
| --- | --- |
| סיכום + שגיאה בשדה | רק טוסט "משהו השתבש" |
| פוקוס לסיכום | גלילה בלי פוקוס |
| לשמור את כל התשובות | איפוס הטופס |
| "הזינו 9 ספרות" | "קלט לא חוקי" |
| צבע + טקסט + אייקון | מסגרת אדומה בלבד |
