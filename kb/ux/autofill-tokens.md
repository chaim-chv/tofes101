---
id: ux/autofill-tokens
title: Autofill — מיפוי autocomplete, inputmode ו-enterkeyhint
type: pattern
status: verified
confidence: verified
updated: 2026-10-29
tags: [forms, autofill, mobile, wcag, html]
sources: [source/mdn-autocomplete, source/mdn-inputmode, source/mdn-enterkeyhint, source/w3c-wcag22]
related: [ux/israeli-input-masking, ux/mobile-layout, ux/hebrew-input]
up: ux/ux-principles
---

# Autofill

WCAG **1.3.5** (AA) דורש שה-purpose של שדה מידע אישי יהיה ניתן לקביעה
פרוגרמטית. הדרך: `autocomplete`. זה גם חוסך הקלדה — שני היתרונות באותו תיקון.

## הטבלה (העתיקו מכאן)

| שדה 101 | `autocomplete` | `inputmode` | `type` | `enterkeyhint` |
| --- | --- | --- | --- | --- |
| שם פרטי | `given-name` | – | `text` | `next` |
| שם משפחה | `family-name` | – | `text` | `next` |
| ת"ז | `off` | `numeric` | `text` | `next` |
| דרכון | `off` | `text` | `text` | `next` |
| תאריך לידה — יום | `bday-day` | `numeric` | `text` | `next` |
| חודש | `bday-month` | `numeric` | `text` | `next` |
| שנה | `bday-year` | `numeric` | `text` | `next` |
| מין | `sex` | – | `select`/radio | – |
| טלפון נייד | `tel-national` | `tel` | `tel` | `next` |
| טלפון קווי | `tel-national` | `tel` | `tel` | `next` |
| אימייל | `email` | `email` | `email` | `next` |
| ישוב | `address-level2` | – | `text` | `next` |
| רחוב | `address-line1` | – | `text` | `next` |
| מספר בית | `address-line2`* | `numeric` | `text` | `next` |
| מיקוד | `postal-code` | `numeric` | `text` | `done` |
| שם מעסיק | `organization` | – | `text` | `next` |

\* אין טוקן תקני נפרד למספר בית; `address-line2` הוא הקרוב. אם מפרידים רחוב/בית, שמרו על תווית ברורה — 1.3.5 נבדק לפי הכוונה, לא רק לפי הטוקן.

מקור הטוקנים: [MDN](../sources/mdn-autocomplete.md); `inputmode`:
[MDN](../sources/mdn-inputmode.md).

## דוגמה

```html
<div class="field">
  <label for="id">תעודת זהות</label>
  <input id="id" name="nationalId" type="text" dir="ltr"
         inputmode="numeric" autocomplete="off"
         autocorrect="off" spellcheck="false"
         aria-describedby="id-hint" maxlength="11">
  <p id="id-hint" class="hint">9 ספרות, כולל ספרת ביקורת</p>
</div>
```

```html
<label for="email">אימייל</label>
<input id="email" name="email" type="email" dir="ltr"
       autocomplete="email" inputmode="email"
       autocapitalize="none" spellcheck="false" enterkeyhint="next">
```

## כללים

1. **`name` משמעותי** (`firstName`, לא `f1`) — משפר autofill ו-password managers.
2. **אל תשימו `autocomplete="off"` על הטופס כולו.** זה שובר 1.3.5 והורס
   את היתרון למשתמש. רק שדות שבהם autofill מסוכן (ת"ז).
3. **ת"ז: `off`** — autofill של מספר אחר הוא סיכון אמיתי; אבל השאירו
   `inputmode` ושלטו בתווית.
4. **בן/בת זוג**: `autocomplete="section-spouse given-name"` — ה-prefix
   `section-*` מבטיח שה-autofill לא יערבב בין אנשים.
5. **`type="tel"`** ולא `number`; `type="email"` ולא `text` (מקש @ בנייד).
6. **`enterkeyhint`** הוא רמז חזותי בלבד — ההתנהגות חייבת להיות ב-JS.
7. בדקו עם **1Password / Bitwarden / iCloud Keychain** — לפחות פעם אחת.

## מה לא לעשות

- לא placeholder במקום label.
- לא `autocomplete="nope"` או ערכים מומצאים — הדפדפן מתעלם והבדיקה נכשלת.
- לא להתנות autofill ב"מילוי אוטומטי" משלנו שדורס את מה שהדפדפן מילא.
- לא לסמן שדה כ"ממולא" רק כי יש לו ערך — בדקו מול המקור.

## Nuxt UI

```vue
<UFormField label="שם פרטי" name="firstName" required>
  <UInput v-model="form.firstName" autocomplete="given-name"
          enterkeyhint="next" dir="auto" size="xl" />
</UFormField>
```

`size="xl"` נותן יעד מגע גדול; אל תסתמכו על ברירת מחדל 32px במובייל.

## Do / Don't

| Do | Don't |
| --- | --- |
| טוקן תקני לכל שדה | ערכים מומצאים |
| `off` רק לת"ז | `off` על כל הטופס |
| `section-*` לבן/בת זוג | ערבוב בין אנשים |
| בדיקה עם password manager | להניח שהדפדפן ימלא |
