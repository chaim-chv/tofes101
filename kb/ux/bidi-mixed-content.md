---
id: ux/bidi-mixed-content
title: Bidi — תעודת זהות, טלפון, אימייל וטקסט מעורב עברית/אנגלית
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [rtl, bidi, numbers, ids, email, a11y]
sources: [source/w3c-bidi-inline, source/w3c-bidi-structural]
related: [ux/rtl-foundations, ux/israeli-input-masking, ux/hebrew-typography]
up: ux/rtl-foundations
---

# תוכן דו-כיווני (bidi)

בעברית, מחרוזת כמו `ת"ז 012345678` או `שולם 1,234.56 ₪` עלולה להיראות
הפוך, להידבק לפיסוק הלא נכון, או להיקרא לא נכון בקורא מסך. זו לא בעיה
קוסמטית: מספר ת"ז שגוי הוא טופס שגוי.

## הכלל

**עטפו כל מחרוזת בכיוון הפוך בתחביר, לא בתווי כיווני נסתרים.**

```html
<!-- מספר מזהה: תמיד LTR, גם בתוך משפט עברי -->
<p>תעודת זהות: <span dir="ltr" class="numeric">012345678</span></p>

<!-- אימייל -->
<p>אימייל: <span dir="ltr" lang="en">name@example.co.il</span></p>

<!-- טלפון -->
<p>נייד: <span dir="ltr">050-1234567</span></p>

<!-- שם מותג / מונח באנגלית -->
<p>מגישים בטופס <span dir="ltr" lang="en">PDF</span> חתום.</p>
```

ב-`dir="ltr"` הדפדפן גם **מבודד** את הרצף, כך שהמספרים לא "נשאבים" לסוף
המשפט ([מקור](kb/sources/w3c-bidi-inline.md)).

## טקסט שמגיע מהמשתמש

```html
<input name="fullName" dir="auto" autocomplete="name">
<textarea name="notes" dir="auto"></textarea>
```

- `dir="auto"` קובע כיוון לפי התו החזק הראשון. טוב לשמות, לא טוב למספרים
  (מספר הוא ניטרלי ולכן עלול להיות מיושר ימינה).
- לשדות מספריים: `dir="ltr"` **קבוע** + `inputmode="numeric"`.
- הצגת קלט משתמש בהמשך (סיכום): `<bdi>` או `<span dir="auto">`, לעולם לא
  הדבקה גולמית בתוך משפט עברי.

```html
<dd><bdi>محمد علي</bdi></dd>   <!-- גם ערבית, גם שמות מעורבים -->
```

## טבלת החלטות לשדות 101

| שדה | כיוון | קלט |
| --- | --- | --- |
| שם פרטי / משפחה | `dir="auto"` | טקסט חופשי |
| ת"ז / דרכון | `dir="ltr"` | `inputmode="numeric"` |
| טלפון | `dir="ltr"` | `inputmode="tel"` |
| אימייל | `dir="ltr"` | `type="email"` |
| מיקוד | `dir="ltr"` | `inputmode="numeric"` |
| מספר תיק ניכויים | `dir="ltr"` | `inputmode="numeric"` |
| סכום / נקודות זיכוי | `dir="ltr"` | `inputmode="decimal"` |
| תאריך | `dir="ltr"` | שלושה שדות |
| שם ישוב / רחוב | `dir="auto"` | טקסט + autocomplete |

## כותרת, ALT וכפתורים

`<title>` ו-`alt` לא תומכים ב-`<span>`. שם משתמשים בתווי בידוד:

```html
<title>&#x2067;101&#x2069; · טופס כרטיס עובד</title>
```

- `U+2066` LRI … `U+2069` PDI — בידוד LTR.
- `U+2067` RLI … `U+2069` PDI — בידוד RTL.
- `&lrm;` / `&rlm;` — רק לתיקון "דליפה" נקודתי, לא כשיטה.

## קורא מסך

- `dir="ltr"` לא מבטיח הגייה נכונה. הוסיפו `lang="en"` למחרוזות אנגליות.
- מספרים נקראים ספרה-ספרה; אם המספר הוא קוד, ודאו שהתווית אומרת "ספרות"
  ולא "מספר" (שקורא מסך עלול להקריא כמספר גדול).
- אל תסתמכו על `aria-label` שמכיל רק מספר — הוסיפו מה זה.

## Do / Don't

| Do | Don't |
| --- | --- |
| `<span dir="ltr">` סביב מזהה | להזריק `\u202A` ידנית בכל מקום |
| `dir="auto"` לשמות | `dir="auto"` לת"ז |
| `lang="en"` לאנגלית | לעטוף את כל העמוד ב-`dir="ltr"` |
| `bdi` לפלט משתמש | `unicode-bidi: bidi-override` |
