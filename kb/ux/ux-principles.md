---
id: ux/ux-principles
title: עקרונות UX — 12 כללים שמחייבים כל מסך
type: concept
status: verified
confidence: verified
updated: 2026-10-29
tags: [ux, principles, hub, a11y, rtl]
sources: [source/govuk-question-pages, source/w3c-wcag22, source/govil-is5568-standard, source/nng-web-form-design]
related: [flow/form-101-service, ux/keyboard-model, ux/checklists/a11y-pr-checklist]
up: index
---

# עקרונות UX

ההוב של תחום ה-UX. כל מסך, רכיב ופיסת קופי חייבים לעבור את 12 הכללים האלה.
כל כלל מפנה לנוד שמפרט אותו עד לרמת הקוד.

## 12 הכללים

1. **החלטה אחת למסך.** כל שלב שואל דבר אחד שאפשר להשיב עליו בלי לזכור את
   הקודם. השאלון הארוך מפורק ל-7–9 שלבים, לא ל-160 שדות בעמוד אחד.
   → [[ux/wizard-vs-long-page]]
2. **RTL הוא ברירת המחדל, לא תרגום.** `dir="rtl"` על `<html>`, נכסי CSS
   לוגיים, ואין `left/right` בקוד. → [[ux/rtl-foundations]]
3. **הנתונים לא עוזבים את המכשיר — וגם אומרים את זה.** אין שרת, אין העלאה,
   אין אנליטיקס כברירת מחדל; ומסבירים מה זה אומר על שמירת טיוטה.
   → [[ux/trust-local-privacy]]
4. **מקלדת היא קלט ראשי.** כל פעולה אפשרית בלי עכבר, כולל חתימה.
   → [[ux/keyboard-model]], [[ux/signature-accessibility]]
5. **טעות היא באג שלנו.** מונעים, מסבירים איך לתקן, ואף פעם לא מוחקים נתונים.
   → [[ux/validation-and-errors]]
6. **שואלים פעם אחת.** תשובה שכבר ניתנה ממולאת מראש או מוצעת לבחירה; "כמו
   למעלה" ו"העתק מבן/בת הזוג" הם כפתורים, לא ניחוש. → [[ux/speed-patterns]]
7. **תמיד יש לאן לחזור, ותמיד יש גיבוי.** Autosave מקומי בכל שינוי, ניווט
   חופשי בין שלבים, ו"המשך מאוחר יותר" בקישור. → [[ux/progress-save-resume]]
8. **הטקסט המשפטי קדוש; העזרה נבנית סביבו.** הצהרת החתימה מוצגת במלואה,
   מילה במילה, ולא מקופלת. מונחים מוסברים בשכבה נפרדת. → [[ux/help-and-glossary]]
9. **מובייל קודם.** 44×44 פיקסל, כפתור ראשי דביק שלא מכסה את השדה הממוקד,
   מקלדת מספרית לשדות מספריים, בלי zoom מעצבן ב-iOS. → [[ux/mobile-layout]]
10. **עברית פשוטה, מגדר בכבוד.** פונים בגוף שני רבים או בצורה ניטרלית; לא
    "הינך נדרש". → [[ux/hebrew-microcopy]]
11. **כל מסך עובר בדיקת מקלדת וקורא מסך לפני merge.** הצ'קליסטים הם שער,
    לא המלצה. → [[ux/checklists/a11y-pr-checklist]]
12. **אין דארקן-פאטרנס.** אין "שלח ופרסם", אין אישור מוקדם, אין שינוי ברירת
    מחדל שמיטיב איתנו. ייצוא ה-PDF הוא זכות, לא מוצר. → [[ux/print-export]]

## איך להשתמש בהוב

| אני בונה… | קרא קודם |
| --- | --- |
| שלד, ניווט, פריסה | [[ux/wizard-vs-long-page]] → [[ux/rtl-foundations]] → [[ux/mobile-layout]] |
| שדה בודד | [[ux/autofill-tokens]] → [[ux/israeli-input-masking]] → [[ux/validation-and-errors]] |
| רכיב בחירה | [[ux/choice-controls]] |
| מסך עזרה / מונח | [[ux/help-and-glossary]] → [[ux/hebrew-microcopy]] |
| חתימה | [[ux/signature-accessibility]] |
| סקירה אחרונה / PR | [[ux/checklists/a11y-pr-checklist]] |

## מה אסור (non-negotiables)

- `tabindex` חיובי, `accesskey`, או קיצור מקש בודד בלי כיבוי.
- `placeholder` בתור תווית.
- `type="number"` לתעודת זהות או טלפון.
- הסתרת שדה חובה מאחורי tooltip.
- כפתור "שלח" מושבת בלי הסבר.
- הצהרת נגישות עם "אנו פועלים להנגיש" בלי פירוט התאמות ופרטי קשר.
- הצהרת התאמה ל-WCAG 2.2 אם בדקנו רק 2.0.

## מקורות

הכללים נשענים על IS 5568 = WCAG 2.0 AA ([מקור](kb/sources/govil-is5568-standard.md)),
WCAG 2.2 ([מקור](kb/sources/w3c-wcag22.md)), דפוסי GOV.UK
([מקור](kb/sources/govuk-question-pages.md)) ומחקר NN/g
([מקור](kb/sources/nng-web-form-design.md)). מקום שבו אלה מתנגשים — WCAG גובר.
