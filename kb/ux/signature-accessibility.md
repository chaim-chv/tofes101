---
id: ux/signature-accessibility
title: חתימה — Canvas, חלופה במקלדת ותוקף משפטי
type: pattern
status: verified
confidence: likely
updated: 2026-10-29
tags: [signature, canvas, a11y, keyboard, legal]
sources: [source/w3c-wcag22]
related: [field/101-signature, ux/focus-management, ux/live-announcements, ux/print-export]
up: ux/ux-principles
---

# חתימה נגישה

השדה עצמו מוגדר ב-[field/101-signature](../field/101-signature.md). כאן
ההשלכות הנגישות והמימוש.

## הבעיה

`<canvas>` הוא משטח ציור. קורא מסך רואה "canvas"; מקלדת לא יכולה לצייר;
משתמש עם רעד לא יכול לחתום בקו רציף. חתימה חייבת להיות אפשרית **בלי
גרירה ובלי עכבר** (2.1.1, 2.5.7).

## שני מסלולים שווים

```html
<fieldset>
  <legend>חתימה</legend>

  <div role="radiogroup" aria-label="דרך החתימה">
    <div class="radio">
      <input type="radio" id="sig-mode-draw" name="sigMode" value="draw" checked>
      <label for="sig-mode-draw">ציור בעכבר או באצבע</label>
    </div>
    <div class="radio">
      <input type="radio" id="sig-mode-type" name="sigMode" value="type">
      <label for="sig-mode-type">הקלדת השם</label>
    </div>
  </div>

  <div id="sig-draw">
    <canvas id="sig" width="600" height="200"
            role="img"
            aria-label="אזור חתימה. אפשר לחתום בעכבר, באצבע או בעט."
            aria-describedby="sig-help"></canvas>
    <p id="sig-help">אפשר גם להקליד את שמכם במלואו באפשרות "הקלדת השם".</p>
    <button type="button" data-clear>ניקוי</button>
  </div>

  <div id="sig-type" hidden>
    <label for="typed">שם מלא לחתימה</label>
    <input id="typed" name="typedSignature" autocomplete="name" dir="auto">
    <p class="hint">לחיצה על "חתימה" תציג את ההצהרה שוב לאישור.</p>
  </div>
</fieldset>
```

- שני המסלולים **גלויים**, לא מוסתרים מאחורי "נגישות".
- הציור לא חובה; ההקלדה שווה ערך.
- `canvas` עם `role="img"` ו-`aria-label` שמסביר מה זה; הוא **לא** יעד פוקוס — ההקלדה היא החלופה.
- `touch-action: none` על הקנבס כדי שלא יגלול בזמן ציור.
- עט/אצבע: `pointerdown/move/up`, `setPointerCapture`, קו חלק (quadratic).
- שטח ציור גדול (לפחות 300×150 CSS px), עובי קו 2–3px, צבע כהה.

## מקלדת

- `Tab` לרדיו "הקלדת השם", ואז לשדה השם — לא מנסים "לצייר" במקלדת.
- אחרי חתימה: `announce("החתימה נרשמה")`, פוקוס ל"אישור וחתימה".
- `Esc` לא מוחק חתימה. "ניקוי" הוא כפתור מפורש, עם אישור.

## הצהרה

- טקסט ההצהרה **מילה במילה**, גלוי, לא מקופל, לא ב-tooltip.
- גודל קריא (18px+), רוחב שורה ≤ 70 תווים.
- לפני החתימה: "אני מצהיר/ה שקראתי את ההצהרה" — צ'קבוקס **נוסף**, לא
  תחליף לחתימה.
- תאריך החתימה מוצג **לפני** ("נחתם בתאריך 29.10.2026").

## תוקף משפטי

`confidence: likely` — חוק חתימה אלקטרונית, התשס"א-2001, מכיר בחתימה
אלקטרונית; אבל **האם מעסיק/רשות מסים מקבלים חתימה שצוירה על מסך** הוא
שאלה משפטית פתוחה (O-6 ב-`PLAN.md`). אל תבטיחו "חתימה מחייבת" בקופי.

מה שכן בטוח:
- אל תסתירו שזו חתימה אלקטרונית.
- שמרו `signedAt` + `declarationVersion` + `declarationHash`.
- הציעו גם **ייצוא והדפסה** למי שצריך חתימה ידנית.
- אם החתימה נדרשת בכתב יד על נייר — כתבו זאת לפני שמתחילים, לא בסוף.

## PDF

- החתימה מוטמעת כווקטור/תמונה חדה, לא כ-200px PNG מטושטש.
- בדף 2, ליד ההצהרה — לא בעמוד נפרד.
- ה-PDF עצמו חייב להיות מתויג וקריא (ת"י 5568 חלק 2).
  → [[ux/print-export]]

## Do / Don't

| Do | Don't |
| --- | --- |
| מסלול הקלדה שווה | "חתמו עם העכבר" בלבד |
| `role="img"` + הסבר | canvas בלי שם |
| הכרזה אחרי חתימה | שקט |
| הצהרה גלויה | "קראתי ואני מאשר" במקום הטקסט |
| שמירת גרסת הצהרה | חתימה בלי הקשר |
