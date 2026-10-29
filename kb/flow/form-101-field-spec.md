---
id: flow/form-101-field-spec
title: מפרט שדות טופס 101 — Field specification (generated)
type: flow
status: verified
confidence: verified
updated: 2026-10-29
tags: [form-101, fields, schema, reference]
sources: [source/tofes101-form-runner-api]
related: [flow/form-101-service, finding/tepez-form-runtime]
up: flow/form-101-service
---

<!-- GENERATED FILE — do not edit by hand.
     Regenerate: `bun run tools/kb/gen-field-spec.ts`
     Source: research/raw/form/tree.json (extracted from the reference implementation). -->

# מפרט שדות — טופס 101 (reference spec)

Every field of the reference implementation, section by section, with its
type, required flag, visibility expression, validators and options.
Machine-readable twin: [form-101-schema.json](./form-101-schema.json).

Legend: `visibleWhen` is a JavaScript expression evaluated by the form runtime
against the section container (`container.*`) and the form model (`model.*`).
`computed` means the field is not user-entered — it is written by an equation.

## —. שנת המס (בחירת שנה)

<sub>section id: `taxYearWrap` · 3 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `taxYearWrap/taxYear` | fInput | שנת המס |  | `fn.today().getUTCMonth() !== 11 && fn.today().getUTCMonth() !== 0` |  |  |
| `taxYearWrap/taxYear` | fRadio | שנת המס | **yes** | `fn.today().getUTCMonth() === 11` |  | _dynamic_ |
| `taxYearWrap/taxYear` | fRadio | שנת המס | **yes** | `fn.today().getUTCMonth() === 0` |  | _dynamic_ |

## א. פרטי המעסיק

<sub>section id: `employer` · 6 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `employer/row3/email2` | fInput | כתובת אימייל 2 |  |  | legacy |  |
| `employer/row3/email3` | fInput | כתובת אימייל 3 |  |  | legacy |  |
| `employer/employerRow/name` | fInput | שם |  |  |  |  |
| `employer/employerRow/address` | fInput | כתובת |  |  |  |  |
| `employer/employerRow/phoneNum` | fInput | מספר טלפון |  |  | legacy |  |
| `employer/employerRow/deductionsFileNum` | fInput | מספר תיק ניכויים |  |  | custom rule: `(''+value)[0]==='9'`<br>digits only<br>integer<br>Israeli ID check digit (Luhn) |  |

## ב. פרטי העובד/ת

<sub>section id: `employee` · 37 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `employee/str` | fInput | טקסט מתאר לעובד |  |  |  |  |
| `employee/nameRow/firstName` | fInput | שם פרטי | **yes** |  | legacy |  |
| `employee/nameRow/lastName` | fInput | שם משפחה | **yes** |  | legacy |  |
| `employee/identity/type` | fRadio | זיהוי לפי | **yes** |  |  | תעודת זהות (`idNum`)<br>דרכון (עבור אזרח זר) (`passport`) |
| `employee/identity/idStr` | fInput | מספר זיהוי לטופס |  |  |  |  |
| `employee/identity/idNumRow/idNum` | fInput | מספר זהות | **yes** |  | digits only<br>integer<br>Israeli ID check digit (Luhn) |  |
| `employee/identity/idNumRow/idCard` | fFile | צילום תעודת זהות וספח |  |  |  |  |
| `employee/identity/passportRow/passportCountry` | fSelect | מדינת הדרכון | **yes** |  | legacy |  |
| `employee/identity/passportRow/passportNum` | fInput | מספר דרכון | **yes** |  | legacy |  |
| `employee/identity/passportRow/passportCard` | fFile | צילום דרכון |  |  |  |  |
| `employee/residencePermit` | fFile | אישור / רשיון שהייה בישראל |  | `container.identity.type === 'passport'` |  |  |
| `employee/datesRow/dateOfBirth` | fDate | תאריך לידה | **yes** |  | custom rule: `container.age == null \|\| container.age >= model._settings.minEmployeeAge`<br>custom rule: `container.age == null \|\| container.age <= model._settings.maxEmployeeAge` |  |
| `employee/datesRow/dateOfBirthStr` | fInput | תאריך לידה לטופס |  |  |  |  |
| `employee/datesRow/age` | fInput | גיל (מחושב אוטומטית) |  |  |  |  |
| `employee/datesRow/ageOnTaxYear` | fInput | גיל בסוף שנת המס (מחושב אוטומטית) |  |  |  |  |
| `employee/datesRow/dateOfAliyah` | fDate | תאריך עליה |  | `container.identity.type !== 'passport'` | custom rule: `value <= fn.today()`<br>custom rule: `!container.dateOfBirth \|\| value >= container.dateOfBirth` |  |
| `employee/datesRow/dateOfAliyahStr` | fInput | תאריך עליה לטופס |  |  |  |  |
| `employee/address/addressRow/city` | fSelect | ישוב | **yes** |  |  |  |
| `employee/address/addressRow/street` | fSelect | רחוב | **yes** |  |  |  |
| `employee/address/addressRow/houseNum` | fInput | מספר בית | **yes** |  |  |  |
| `employee/address/addressRow/zipCode` | fInput | מיקוד |  |  | legacy |  |
| `employee/phonesRow/mobileNum` | fInput | מספר טלפון נייד | **yes** | `!container.phoneNum` | regex<br>regex<br>IL phone |  |
| `employee/phonesRow/mobileNum` | fInput | מספר טלפון נייד |  | `container.phoneNum` | regex<br>regex<br>IL phone |  |
| `employee/phonesRow/phoneNum` | fInput | מספר טלפון |  |  | legacy |  |
| `employee/email` | fInput | כתובת דואר אלקטרוני |  | `model._settings.employeeEmail === 'optional'` | legacy |  |
| `employee/email` | fInput | כתובת דואר אלקטרוני | **yes** | `model._settings.employeeEmail !== 'optional'` | legacy |  |
| `employee/miscRow/sex` | fRadio | מין | **yes** |  |  | זכר (`male`)<br>נקבה (`female`) |
| `employee/miscRow/sex_label` | fInput | מין - תווית |  |  |  |  |
| `employee/miscRow/maritalStatus` | fRadio | מצב משפחתי | **yes** |  |  | רווק/ה (`single`)<br>נשוי/אה (`married`)<br>גרוש/ה (`divorced`)<br>אלמן/ה (`widowed`)<br>פרוד/ה (`separated`) |
| `employee/miscRow/maritalStatus_label` | fInput | מצב משפחתי - תווית |  |  |  |  |
| `employee/miscRow/assessingOfficerSeparatedCertificate` | fFile | אישור פקיד שומה |  | `container.maritalStatus == 'separated'` |  |  |
| `employee/miscRow/ilResident` | fRadio | תושב ישראל | **yes** | `container.identity.type !== 'passport'` | legacy | כן (`true`)<br>לא (`false`) |
| `employee/miscRow/kibbutzMember` | fRadio | חבר קיבוץ / מושב שיתופי | **yes** | `container.identity.type !== 'passport'` |  | כן (`true`)<br>לא (`false`) |
| `employee/miscRow/kibbutzGetsIncome` | fRadio | הכנסותיי ממעסיק זה מועברות לקיבוץ | **yes** | `container.identity.type !== 'passport' && container.kibbutzMember` |  | כן (`true`)<br>לא (`false`) |
| `employee/miscRow/healthFundMember` | fRadio | חבר בקופת חולים | **yes** |  |  | כן (`true`)<br>לא (`false`) |
| `employee/miscRow/healthFundName` | fRadio | שם הקופה | **yes** | `container.healthFundMember` |  | כללית (`clalit`)<br>מכבי (`maccabi`)<br>מאוחדת (`meuhedet`)<br>לאומית (`leumit`) |
| `employee/miscRow/healthFundName_label` | fInput | חבר בקופת חולים - תווית |  |  |  |  |

## ג. פרטים על הילדים

<sub>section id: `childrenWrapper` · 7 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `childrenWrapper/children/row1/firstName` | fInput | שם | **yes** |  | legacy |  |
| `childrenWrapper/children/row1/idNum` | fInput | מספר זהות | **yes** |  | digits only<br>integer<br>Israeli ID check digit (Luhn)<br>custom rule: `fn.filter(model.children, { idNum: value }).length <= 1` |  |
| `childrenWrapper/children/row1/dateOfBirth` | fDate | תאריך לידה | **yes** |  | custom rule: `container.ageOnTaxYear == null \|\| container.ageOnTaxYear < 19`<br>custom rule: `container.ageOnTaxYear == null \|\| container.ageOnTaxYear >= 0` |  |
| `childrenWrapper/children/row1/dateOfBirthStr` | fInput | תאריך לידה לטופס |  |  |  |  |
| `childrenWrapper/children/row1/ageOnTaxYear` | fInput | גיל בסוף שנת המס (מחושב אוטומטית) |  |  |  |  |
| `childrenWrapper/children/row2/possession` | fBool | הילד נמצא בחזקתי |  |  |  |  |
| `childrenWrapper/children/row2/childAllowance` | fBool | אני מקבל/ת בגינו/ה קצבת ילדים מביטוח לאומי |  |  | legacy |  |

## ד. הכנסותיי ממעסיק זה

<sub>section id: `thisIncome` · 3 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `thisIncome/types` | fCheckbox | אני מקבל/ת | **yes** |  | custom rule: `fn.intersection(value, ['monthly', 'additional', 'partial', 'daily']).length <= 1`<br>custom rule: `!( model._settings.taxCoordinationWarning === 'error' && fn.includes(value, 'additional') && !model.taxCoordinationRequest.isRequesting )` | משכורת חודש (`monthly`)<br>משכורת בעד משרה נוספת (`additional`)<br>משכורת חלקית (`partial`)<br>שכר עבודה (עובד יומי) (`daily`)<br>קצבה (`allowance`)<br>מלגה (`scholarship`) |
| `thisIncome/startDate` | fDate | תאריך תחילת העבודה בשנת המס | **yes** |  | legacy |  |
| `thisIncome/startDateStr` | fInput | תאריך לידה לטופס |  |  |  |  |

## ה. הכנסות אחרות

<sub>section id: `otherIncomes` · 5 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `otherIncomes/hasIncomes` | fRadio | יש לך הכנסות אחרות? | **yes** |  | legacy | אין לי הכנסות אחרות ממשכורת (משכורת חודש, בעד משרה נוספת, משכורת חלקית, שכר עבודה), מקצבה וממלגה (`false`)<br>יש לי הכנסות נוספות כמפורט להלן (`true`) |
| `otherIncomes/hasIncomesWrap/types` | fCheckbox | פירוט הכנסות | **yes** |  |  | משכורת חודש (`monthly`)<br>משכורת בעד משרה נוספת (`additional`)<br>משכורת חלקית (`partial`)<br>שכר עבודה (עובד יומי) (`daily`)<br>קצבה (`allowance`)<br>מלגה (`scholarship`) |
| `otherIncomes/hasIncomesWrap/typesOther` | fInput | פירוט מקור הכנסה אחר | **yes** | `fn.includes(container.types, 'other')` |  |  |
| `otherIncomes/hasIncomesWrap/utilizeTaxCreditsElsewhere` | fRadio | נקודות זיכוי | **yes** |  |  | אבקש לקבל נקודות זיכוי ומדרגות מס כנגד הכנסתי זו (סעיף ד). איני מקבל/ת אותם בהכנסה אחרת. (`false`)<br><span>אני מקבל/ת נקודות זיכוי ומדרגות מס בהכנסה אחרת ועל כן איני זכאי/ת להם כנגד הכנסה זו.</span> (`true`) |
| `otherIncomes/hasIncomesWrap/employerContributions` | fCheckbox | הפרשות |  |  |  | אין מפרישים עבורי לקרן השתלמות בגין הכנסתי האחרת, או שכל הפרשות המעסיק לקרן השתלמות בגין הכנסתי האחרת מצורפות להכנסתי האחרת. (`no-study-fund`)<br><span>אין מפרישים עבורי לקצבה/לביטוח אובדן כושר עבודה/פיצויים בגין הכנסתי האחרת, או שכל הפרשות המעסיק לקצבה/לביטוח אובדן כושר עבודה/פיצויים בגין הכנסתי האחרת מצורפות להכנסתי האחרת.</span> (`no-pension`) |

## ו. פרטי בן/בת הזוג

<sub>section id: `spouse` · 15 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `spouse/spouseWrapper/nameRow/firstName` | fInput | שם פרטי | **yes** |  | legacy |  |
| `spouse/spouseWrapper/nameRow/lastName` | fInput | שם משפחה | **yes** |  | legacy |  |
| `spouse/spouseWrapper/identity/idRow/type` | fRadio | זיהוי לפי | **yes** |  |  | תעודת זהות (`idNum`)<br>דרכון (עבור אזרח זר) (`passport`) |
| `spouse/spouseWrapper/identity/idRow/idNum` | fInput | מספר זהות | **yes** | `container.type === 'idNum'` | digits only<br>integer<br>Israeli ID check digit (Luhn) |  |
| `spouse/spouseWrapper/identity/idRow/passportCountry` | fSelect | מדינת הדרכון | **yes** | `container.type === 'passport'` |  |  |
| `spouse/spouseWrapper/identity/idRow/passportNum` | fInput | מספר דרכון | **yes** | `container.type === 'passport'` | legacy |  |
| `spouse/spouseWrapper/identity/idStr` | fInput | מספר זיהוי לטופס |  |  |  |  |
| `spouse/spouseWrapper/miscRow/dateOfBirth` | fDate | תאריך לידה | **yes** |  | legacy |  |
| `spouse/spouseWrapper/miscRow/dateOfBirthStr` | fInput | תאריך לידה לטופס |  |  |  |  |
| `spouse/spouseWrapper/miscRow/age` | fInput | גיל (מחושב אוטומטית) |  |  |  |  |
| `spouse/spouseWrapper/miscRow/ageOnTaxYear` | fInput | גיל בסוף שנת המס (מחושב אוטומטית) |  |  |  |  |
| `spouse/spouseWrapper/miscRow/dateOfAliyah` | fDate | תאריך עליה |  | `container.identity.type !== 'passport'` | custom rule: `value <= fn.today()`<br>custom rule: `!container.dateOfBirth \|\| value >= container.dateOfBirth` |  |
| `spouse/spouseWrapper/miscRow/dateOfAliyahStr` | fInput | תאריך עליה לטופס |  |  |  |  |
| `spouse/spouseWrapper/miscRow/hasIncome` | fRadio | הכנסה | **yes** |  |  | אין לבן/בת הזוג כל הכנסה (`no`)<br>יש לבן/בת הזוג הכנסה (`yes`) |
| `spouse/spouseWrapper/miscRow/incomeTypes` | fCheckbox | סוג הכנסה | **yes** | `model.spouse.hasIncome === 'yes'` |  | עבודה/קיצבה/עסק (`work-allowance-business`)<br>הכנסה אחרת (`other`) |

## ז. שינויים במהלך השנה

<sub>section id: `changesWrapper` · 0 fields</sub>

_No user-entered fields._

## ח. בקשה לפטור או זיכוי ממס

<sub>section id: `taxCreditRequest` · 70 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `taxCreditRequest/wrapper/ilResident/checked` | fBool | 1. אני תושב/ת ישראל |  |  |  |  |
| `taxCreditRequest/wrapper/disabled/checked` | fBool | 2. אני נכה 100% / עיוור/ת לצמיתות |  |  |  |  |
| `taxCreditRequest/wrapper/disabled/wrapper/certificate` | fFile | אישור משרד הביטחון/האוצר/פקיד השומה/תעודת עיוור שהוצאה לאחר 1/1/94 |  |  |  |  |
| `taxCreditRequest/wrapper/disabled/wrapper/monthlyCompensation` | fBool | 2ב. בנוסף, אני מקבל תגמול חודשי לפי חוק הנכים (תגמולים ושיקום) או לפי חוק התגמולים לנפגעי פעולות איבה. |  |  |  |  |
| `taxCreditRequest/wrapper/disabled/wrapper/monthlyCompensationCertificate` | fFile | אישור על קבלת תגמול חודשי |  | `container.monthlyCompensation` |  |  |
| `taxCreditRequest/wrapper/creditedLocality/checked` | fBool | 3. אני תושב/ת קבוע/ה בישוב מזכה. אני ובני משפחתי מדרגה ראשונה, מתגוררים ביישוב ואין לי "מרכז חיים" נוסף. |  |  |  |  |
| `taxCreditRequest/wrapper/creditedLocality/wrapper/row/fromDate` | fDate | מתאריך | **yes** |  |  |  |
| `taxCreditRequest/wrapper/creditedLocality/wrapper/row/locality` | fSelect | הישוב | **yes** |  |  |  |
| `taxCreditRequest/wrapper/creditedLocality/wrapper/row/form1312a` | fFile | אישור של הרשות ע"ג טופס 1312א |  |  |  |  |
| `taxCreditRequest/wrapper/newImmigrantOrReturningResident/checked` | fBool | 4. אני עולה חדש/ה |  |  |  |  |
| `taxCreditRequest/wrapper/newImmigrantOrReturningResident/wrapper/row/type` | fRadio | סוג |  |  |  | עולה חדש/ה (`immigrant`)<br>תושב/ת חוזר/ת (`returning`) |
| `taxCreditRequest/wrapper/newImmigrantOrReturningResident/wrapper/row/fromDate` | fDate | מתאריך | **yes** |  | legacy |  |
| `taxCreditRequest/wrapper/newImmigrantOrReturningResident/wrapper/row/newImmigrantCertificate` | fFile | תעודת עולה | **yes** | `container.type === 'immigrant'` |  |  |
| `taxCreditRequest/wrapper/newImmigrantOrReturningResident/wrapper/row/returningResidentCertificate` | fFile | אישור משרד הקליטה (תעודת "תושב חוזר" מעל 6 שנים) | **yes** | `container.type === 'returning'` |  |  |
| `taxCreditRequest/wrapper/newImmigrantOrReturningResident/wrapper/noIncomeUntil` | fDate | לא הייתה לי הכנסה בישראל מתחילת שנת המס הנוכחית עד תאריך |  |  | legacy |  |
| `taxCreditRequest/wrapper/incomelessSpouse/checked` | fBool | 5. בגין בן/בת זוגי המתגורר/ת עימי ואין לו/לה הכנסות בשנת המס |  |  | legacy |  |
| `taxCreditRequest/wrapper/incomelessSpouse/wrapper/certificate` | fFile | אישור נכה או עיוור בגין העובד/ת ו/או בן/בת הזוג |  |  |  |  |
| `taxCreditRequest/wrapper/separatedSingleParent/checked` | fBool | 6. אני הורה במשפחה חד הורית החי בנפרד |  |  | custom rule: `model.employee.maritalStatus !== 'married'`<br>custom rule: `fn.filter(model.children, { childAllowance: true }).length > 0` |  |
| `taxCreditRequest/wrapper/children/checked` | fBool | 7. בגין ילדי שבחזקתי המפורטים בחלק ג |  |  | custom rule: `!value \|\| ( ( model.employee.maritalStatus !== 'married' && fn.filter(model.children, { childAllowance: true, possession: true }).length > 0 ) \|\| ( model.employee.sex === 'female' && model.employee.maritalStatus === 'married' ) \|\| ( model.taxCreditRequest.singleParent.checked ) )`<br>custom rule: `!model.taxCreditRequest.separatedSingleParent.checked \|\| value`<br>custom rule: `!model.taxCreditRequest.singleParent.checked \|\| model.taxCreditRequest.toddlers.checked \|\| value` |  |
| `taxCreditRequest/wrapper/children/row/age0Count` | fInput | מספר ילדים שנולדו בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/children/row/age0Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/row/age1To2Count` | fInput | מספר ילדים שימלאו להם שנה אחת עד שנתיים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/children/row/age1To2Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/row/age3Count` | fInput | מספר ילדים שימלאו להם 3 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/children/row/age3Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/row/age4To5Count` | fInput | מספר ילדים שימלאו להם 4 שנים עד 5 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/children/row/age4To5Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/row/age6To17Count` | fInput | מספר ילדים שימלאו להם 6 שנים עד 17 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/children/row/age6To17Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/row/age18Count` | fInput | מספר ילדים שימלאו להם 18 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/children/row/age18Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/legacy/age6To12Count` | fInput | מספר ילדים שימלאו להם 6 שנים עד 12 שנים בשנת המס |  |  |  |  |
| `taxCreditRequest/wrapper/children/legacy/age6To12Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/legacy/age13To17Count` | fInput | מספר ילדים שימלאו להם 13 שנים עד 17 שנים בשנת המס |  |  |  |  |
| `taxCreditRequest/wrapper/children/legacy/age13To17Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/children/legacy/age1To5Count` | fInput | מספר ילדים שימלאו להם שנה אחת עד 5 שנים בשנת המס |  |  |  |  |
| `taxCreditRequest/wrapper/children/legacy/age1To5Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/checked` | fBool | 8. בגין ילדי |  |  | custom rule: `!value \|\| ( ( model.employee.sex === 'male' && model.employee.maritalStatus === 'married' ) \|\| ( model.employee.sex && model.employee.maritalStatus && model.employee.maritalStatus !== 'married' && !model.taxCreditRequest.children.checked ) \|\| ( model.employee.sex === 'female' && model.employee.maritalStatus && model.employee.maritalStatus !== 'married' && fn.reject(model.children, 'possession').length > 0 ) \|\| ( model.taxCreditRequest.singleParent.checked ) )`<br>custom rule: `!model.taxCreditRequest.singleParent.checked \|\| model.taxCreditRequest.children.checked \|\| value` |  |
| `taxCreditRequest/wrapper/toddlers/row/age0Count` | fInput | מספר ילדים שנולדו בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age0Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age1To2Count` | fInput | מספר ילדים שימלאו להם שנה אחת עד שנתיים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age1To2Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age3Count` | fInput | מספר ילדים שימלאו להם 3 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age3Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age4To5Count` | fInput | מספר ילדים שימלאו להם 4 שנים עד 5 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age4To5Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age6To17Count` | fInput | מספר ילדים שימלאו להם 6 שנים עד 17 שנים בשנת המס | **yes** |  |  |  |
| `taxCreditRequest/wrapper/toddlers/row/age6To17Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/legacy/age6To12Count` | fInput | מספר ילדים שימלאו להם 6 שנים עד 12 שנים בשנת המס |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/legacy/age6To12Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/legacy/age1To5Count` | fInput | מספר ילדים שימלאו להם שנה אחת עד 5 שנים בשנת המס |  |  |  |  |
| `taxCreditRequest/wrapper/toddlers/legacy/age1To5Checked` | fBool | מסומן |  |  |  |  |
| `taxCreditRequest/wrapper/singleParent/checked` | fBool | 9. אני הורה יחיד לילדי שבחזקתי (המפורטים בסעיף 7 ו-8 לעיל). |  |  |  |  |
| `taxCreditRequest/wrapper/childSupport/checked` | fBool | 10. בגין ילדי שאינם בחזקתי המפורטים בחלק ג ואני משתתף/ת בכלכלתם. |  |  | legacy |  |
| `taxCreditRequest/wrapper/childSupport/judgement` | fFile | צילום פסק דין המחייב בתשלום מזונות |  | `container.checked` |  |  |
| `taxCreditRequest/wrapper/disabledChild/checked` | fBool | 11. אני הורה לילדים עם מוגבלות שטרם מלאו להם 19 שנים, בגינם אני מקבל/ת גמלת ילד נכה מהמוסד לביטוח לאומי. |  |  |  |  |
| `taxCreditRequest/wrapper/disabledChild/count` | fInput | מספר הילדים עם מוגבלות שטרם מלאו להם 19 שנים, בגינם את/ה מקבל/ת גמלת ילד נכה מהמוסד לביטוח לאומי | **yes** | `container.checked` | <br>numeric range |  |
| `taxCreditRequest/wrapper/disabledChild/disabledChildBenefitNiiCertificate` | fFile | אישור גמלת ילד נכה מהמוסד לביטוח לאומי לשנה נוכחית | **yes** | `container.checked` |  |  |
| `taxCreditRequest/wrapper/alimony/checked` | fBool | 12. בגין מזונות לבן/בת זוגי לשעבר. |  |  | legacy |  |
| `taxCreditRequest/wrapper/alimony/judgement` | fFile | <span>צילום פסק דין המחייב בתשלום מזונות</span> |  | `container.checked` |  |  |
| `taxCreditRequest/wrapper/youngEmployeeOrSpouse/checked` | fBool | 13. מלאו לי או לבן/בת זוגי 16 שנים וטרם מלאו לי או לבן/בת זוגי 18 שנים בשנת המס. |  |  | custom rule: `!value \|\| model.employee.dateOfBirth`<br>custom rule: `!value \|\| model.employee.maritalStatus !== 'married' \|\| model.spouse.dateOfBirth`<br>custom rule: `!value \|\| model.employee.maritalStatus === 'married' \|\| ( model.employee.ageOnTaxYear >= 16 && model.employee.ageOnTaxYear < 18 )`<br>custom rule: `!value \|\| model.employee.maritalStatus !== 'married' \|\| ( model.spouse.ageOnTaxYear >= 16 && model.spouse.ageOnTaxYear < 18) \|\| ( model.employee.ageOnTaxYear >= 16 && model.employee.ageOnTaxYear < 18)`<br>custom rule: `value \|\| model._settings.teenagerCreditPointNotUtilizedWarning !== 'warn' \|\| !( (model.employee.ageOnTaxYear >= 16 && model.employee.ageOnTaxYear < 18) \|\| (model.employee.maritalStatus === 'married' && model.spouse.ageOnTaxYear && model.spouse.ageOnTaxYear >= 16 && model.spouse.ageOnTaxYear < 18) )` |  |
| `taxCreditRequest/wrapper/dischargedFromService/checked` | fBool | 14. אני חייל/ת משוחרר/ת / שרתתי בשירות לאומי. |  |  |  |  |
| `taxCreditRequest/wrapper/dischargedFromService/wrapper/row/serviceStartDate` | fDate | תאריך תחילת שירות | **yes** |  | custom rule: `value <= fn.today()`<br>custom rule: `!container.serviceEndDate \|\| value < container.serviceEndDate` |  |
| `taxCreditRequest/wrapper/dischargedFromService/wrapper/row/serviceEndDate` | fDate | תאריך סיום שירות | **yes** |  | custom rule: `value <= fn.today()`<br>custom rule: `!container.serviceStartDate \|\| value > container.serviceStartDate` |  |
| `taxCreditRequest/wrapper/dischargedFromService/wrapper/row/dischargeCertificate` | fFile | תעודת שחרור/ סיום שירות |  |  |  |  |
| `taxCreditRequest/wrapper/studies/checked` | fBool | 15. בגין סיום לימודים לתואר אקדמי, סיום התמחות או סיום לימודי מקצוע. |  |  |  |  |
| `taxCreditRequest/wrapper/studies/form119` | fFile | הצהרה בטופס 119 |  | `container.checked` |  |  |
| `taxCreditRequest/wrapper/combatReserveService/checked` | fBool | 16. שירתתי כלוחם/לוחמת מילואים בשנת המס הקודמת. |  |  |  |  |
| `taxCreditRequest/wrapper/combatReserveService/wrapper/days` | fInput | סה”כ ימי מילואים בשנת המס הקודמת | **yes** |  | <br>numeric range |  |
| `taxCreditRequest/wrapper/combatReserveService/wrapper/eligibilityCertificate` | fFile | אישור מצה"ל על זכאות בעד שירות מילואים כלוחם |  |  |  |  |

## ט. תיאום מס

<sub>section id: `taxCoordinationRequest` · 12 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `taxCoordinationRequest/isRequesting` | fBool | צירוף/עריכת תיאום מס |  |  |  |  |
| `taxCoordinationRequest/requestWrapper/type` | fRadio | סיבת הבקשה | **yes** |  |  | לא הייתה לי הכנסה מתחילת שנת המס הנוכחית עד לתחילת עבודתי אצל מעסיק זה. (`no-previous-incomes`)<br>יש לי הכנסות נוספות ממשכורת כמפורט להלן. (`other-incomes-list`)<br>פקיד השומה אישר תיאום לפי אישור מצורף. (`assessing-officer-certificate`) |
| `taxCoordinationRequest/requestWrapper/noPreviousIncomesCertificate` | fFile | הוכחות לחוסר הכנסה |  | `container.type === 'no-previous-incomes'` |  |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row1/name` | fInput | שם | **yes** |  |  |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row1/address` | fInput | כתובת | **yes** |  |  |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row1/deductionsFileNum` | fInput | מספר תיק ניכויים | **yes** |  | custom rule: `(''+value)[0]==='9'`<br>digits only<br>integer<br>Israeli ID check digit (Luhn) |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row2/type` | fRadio | סוג הכנסה | **yes** |  |  | עבודה (`work`)<br>קיצבה (`allowance`)<br>מילגה (`scholarship`)<br>אחר (`other`) |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row2/type_label` | fInput | סוג הכנסה - תווית |  |  |  |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row2/monthlyIncome` | fInput | הכנסה חודשית | **yes** |  |  |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/row2/monthlyDeductedTax` | fInput | המס שנוכה | **yes** |  |  |  |
| `taxCoordinationRequest/requestWrapper/otherIncomes/payslip` | fFile | צילום תלוש שכר |  |  |  |  |
| `taxCoordinationRequest/requestWrapper/assessingOfficerCertificate` | fFile | אישור תיאום מס ע"י פקיד שומה |  | `container.type === 'assessing-officer-certificate'` |  |  |

## י. הצהרה וחתימה

<sub>section id: `_confirmation` · 2 fields</sub>

| field | type | label | required | visible when | rules | options |
| --- | --- | --- | --- | --- | --- | --- |
| `_confirmation/signature` | fSign | חתימת המבקש/ת | **yes** |  |  |  |
| `_confirmation/time` | fDate | תאריך | **yes** | `container.signature` |  |  |

## —. נספח – מסמכים

<sub>section id: `appendix` · 0 fields</sub>

_No user-entered fields._

