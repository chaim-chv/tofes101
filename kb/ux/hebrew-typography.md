---
id: ux/hebrew-typography
title: טיפוגרפיה עברית ל-UI — פונטים, גדלים, מספרים
type: pattern
status: likely
confidence: likely
updated: 2026-10-29
tags: [hebrew, typography, fonts, legibility, rtl]
sources: [source/w3c-wcag22]
related: [ux/rtl-foundations, ux/mobile-layout, ux/hebrew-microcopy]
up: ux/ux-principles
---

# טיפוגרפיה עברית

`confidence: likely` — הבחירות here הן המלצות עיצוב מבוססות תרגול, לא ממצא
מחקרי מתוקף. מה שכן מחייב: 1.4.4 (200% טקסט), 1.4.12 (ריווח), 1.4.3 (ניגוד).

## פונטים

| פונט | למה | איפה |
| --- | --- | --- |
| **Assistant** | עברית מקורית, x-height גבוה, משקלים 200–800, משתנה | ברירת מחדל ל-UI |
| **Heebo** | מבוסס Roboto, קריא, זמין בכל מקום | חלופי ל-UI |
| **Noto Sans Hebrew** | כיסוי מלא, מטא-משפחה | fallback / מסמכים |
| **Rubik** | מעוגל, ידידותי, קצת "שיווקי" | כותרות בלבד |
| **Frank Ruhl Libre** | סריפי, ממלכתי | מסמך PDF / הדפסה, לא UI |

לא להשתמש בגופן סריפי לטופס. לא להשתמש ב-Courier/מונוספייס לעברית —
רוב המונוספייס לא תומכים בעברית בכלל.

## סקאלה

```css
:root {
  --font-ui: "Assistant", "Heebo", "Noto Sans Hebrew", system-ui, sans-serif;
  --text-base: 1.125rem;   /* 18px, לא 16 */
  --leading: 1.6;
  --measure: 62ch;
}
body { font-family: var(--font-ui); font-size: var(--text-base); line-height: var(--leading); }
.prose { max-inline-size: var(--measure); text-align: start; }
```

- **18px** לגוף בטופס. 16px הוא המינימום החוקי, לא היעד.
- **line-height 1.6** בעברית (אין ascend/descend כמו בלטינית; השורות
  "נדבקות" אחרת).
- **משקל 400**, לא 300. דק מדי בעברית מאבד קצוות באותיות כמו ס/ם.
- **רוחב שורה 55–70 תווים.** בטופס רוחב מלא עדיף על עמודות צרות.
- **לא** `letter-spacing` שלילי, **לא** `text-transform: uppercase` (אין
  אותיות גדולות בעברית; זה רק שובר אנגלית).
- הדגשה: **`font-weight: 600`** או רקע, לא קו תחתון (מתנגש בקישורים).

## מספרים

- השתמשו בספרות lining (ברירת מחדל ברוב הפונטים העבריים).
- בסכומים ובטבלאות: `font-variant-numeric: tabular-nums` — אחרת העמודה
  "רוקדת".
- אל תכתבו מספרים במילים ("שלוש נקודות") — המספר הספרתי מדויק יותר.
- `₪` לפני או אחרי? בישראל נהוג `1,234 ₪` (אחרי, עם רווח). שמרו על אחידות.

```css
.amount { font-variant-numeric: tabular-nums; direction: ltr; unicode-bidi: isolate; }
```

## טעינת פונט

```css
@font-face {
  font-family: "Assistant";
  src: url("/fonts/assistant-hebrew-var.woff2") format("woff2-variations");
  font-weight: 200 800;
  font-display: swap;
  unicode-range: U+0590-05FF, U+200F, U+20AA, U+0020-007E;
}
```

- self-host, woff2, Hebrew subset + Latin basic.
- `font-display: swap` + fallback עם `size-adjust` כדי למנוע CLS.
- אל תטענו 6 משקלים; 400/600/700 מספיקים.

## בדיקות

1. 200% zoom — אין חיתוך, אין חפיפה, אין גלילה אופקית (1.4.4, 1.4.10).
2. `text-spacing` מוגבר (1.4.12): line-height 1.5×, letter-spacing 0.12em,
   word-spacing 0.16em — אין חיתוך.
3. ניגודיות: טקסט 4.5:1, טקסט גדול 3:1, גבולות שדות 3:1 (1.4.11).
4. בדיקה על Android (Roboto fallback) ועל iOS (SF Hebrew) — המטריקות שונות.

## Do / Don't

| Do | Don't |
| --- | --- |
| Assistant/Heebo 18px | 14px "כדי שייכנס" |
| `tabular-nums` לסכומים | מספרים פרופורציונליים בטבלה |
| משקל 400–600 | 200 דק על רקע לבן |
| `text-align: start` | `text-align: right` גלובלי |
| פונט עברי אמיתי | הצגת עברית ב-Arial |
