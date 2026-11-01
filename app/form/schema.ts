/**
 * טופס 101 — the form definition, as data.
 *
 * Rules of this file:
 *  - one `FieldDef` per fact (label, condition, validation, PDF slot);
 *  - conditions are predicates over `FormState`, never strings, never `eval`;
 *  - no Hebrew/English text here — only message keys (checked by a unit test);
 *  - field ids are stable and are used as storage/export keys.
 *
 * Legal background for every block: kb/law/form-101.md.
 */
import type { FieldDef, FormSchema, FormState, Step } from "./types"
import type { MessageKey } from "~/locales"
import {
  afterField,
  ageAtTaxYearEndBetween,
  ageBetween,
  atLeastOne,
  atMostOneOf,
  beforeField,
  childAgeAtTaxYearEnd,
  dateInTaxYear,
  decimalRange,
  deductionFileNumber,
  distinctFrom,
  email,
  firstOf,
  integerRange,
  israeliId,
  israeliPhone,
  israeliZip,
  issue,
  notBeforeField,
  notFuture,
  signature,
  validDate,
  youngEmployeeEligible,
} from "./validators"
import { asBool, TAX_YEAR } from "./values"
import { hasOtherIncome, spousePresent } from "./derive"

const yesNo = [
  { value: true, labelKey: "opt.yes" },
  { value: false, labelKey: "opt.no" },
] as const

const isId = (s: FormState) => s.values["employee.idKind"] !== "passport"
const isPassport = (s: FormState) => s.values["employee.idKind"] === "passport"
const isMarried = (s: FormState) => spousePresent(s)
const creditsBlocked = (s: FormState) => hasOtherIncome(s) && s.values["other.creditsElsewhere"] === "yes"

/** Does the children repeater contain a child for whom the employee gets child allowance? */
const hasChildWithAllowance = (s: FormState): boolean => {
  const rows = s.values["children"]
  return Array.isArray(rows) && (rows as Array<Record<string, unknown>>).some((row) => row?.["allowance"] === true)
}

const childRowsOf = (s: FormState): Array<Record<string, unknown>> => {
  const rows = s.values["children"]
  return Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : []
}

const hasChildInCustody = (s: FormState): boolean => childRowsOf(s).some((row) => row?.["custody"] === true)
const hasChildOutsideCustody = (s: FormState): boolean =>
  childRowsOf(s).some((row) => row?.["custody"] === false)

/* ------------------------------------------------------------------ steps */

const stepEmployer: Step = {
  id: "employer",
  titleKey: "step.employer.title",
  introKey: "step.employer.intro",
  fields: [
    {
      id: "employer.name",
      kind: "text",
      labelKey: "f.employer.name",
      autoComplete: "organization",
      required: (s) => !asBool(s.values["employer.unknown"]),
      maxLength: 120,
      span: 12,
    },
    {
      id: "employer.unknown",
      kind: "checkbox",
      labelKey: "f.employer.unknown",
      helpKey: "f.employer.unknown.help",
      span: 12,
    },
    {
      id: "employer.address",
      kind: "text",
      labelKey: "f.employer.address",
      when: (s) => !asBool(s.values["employer.unknown"]),
      autoComplete: "street-address",
      maxLength: 160,
      span: 12,
    },
    {
      id: "employer.phone",
      kind: "text",
      labelKey: "f.employer.phone",
      when: (s) => !asBool(s.values["employer.unknown"]),
      inputMode: "tel",
      inputFilter: "phone",
      pattern: "[0-9+\\-\\s]*",
      autoComplete: "tel",
      maxLength: 15,
      validate: israeliPhone(),
      span: 6,
    },
    {
      id: "employer.deductionFile",
      kind: "text",
      labelKey: "f.employer.deductionFile",
      helpKey: "f.employer.deductionFile.help",
      when: (s) => !asBool(s.values["employer.unknown"]),
      inputMode: "numeric",
      inputFilter: "digits",
      pattern: "[0-9]*",
      maxLength: 9,
      validate: deductionFileNumber(),
      span: 6,
    },
  ],
}

const stepIdentity: Step = {
  id: "identity",
  titleKey: "step.identity.title",
  introKey: "step.identity.intro",
  fields: [
    {
      id: "employee.idKind",
      kind: "radio",
      labelKey: "f.employee.idKind",
      initial: "idNum",
      required: true,
      options: [
        { value: "idNum", labelKey: "opt.idKind.id" },
        { value: "passport", labelKey: "opt.idKind.passport" },
      ],
      span: 12,
    },
    {
      id: "employee.idNum",
      kind: "text",
      labelKey: "f.employee.idNum",
      helpKey: "f.employee.idNum.help",
      when: isId,
      required: true,
      inputMode: "numeric",
      inputFilter: "digits",
      pattern: "[0-9]*",
      maxLength: 9,
      autoComplete: "off",
      validate: firstOf(israeliId(), distinctFrom(["spouse.idNum"], { "spouse.idNum": "spouse.idNum" })),
      span: 6,
    },
    {
      id: "employee.passportCountry",
      kind: "text",
      labelKey: "f.employee.passportCountry",
      when: isPassport,
      required: true,
      maxLength: 60,
      span: 6,
    },
    {
      id: "employee.passportNum",
      kind: "text",
      labelKey: "f.employee.passportNum",
      when: isPassport,
      required: true,
      maxLength: 20,
      span: 6,
    },
    {
      id: "employee.firstName",
      kind: "text",
      labelKey: "f.employee.firstName",
      required: true,
      autoComplete: "given-name",
      maxLength: 60,
      span: 6,
    },
    {
      id: "employee.lastName",
      kind: "text",
      labelKey: "f.employee.lastName",
      required: true,
      autoComplete: "family-name",
      maxLength: 60,
      span: 6,
    },
    {
      id: "employee.birthDate",
      kind: "date",
      labelKey: "f.employee.birthDate",
      required: true,
      calendarStartYear: 1990,
      autoComplete: "bday",
      validate: firstOf(validDate(), notFuture(), ageBetween(14, 120, "employee.birthDate")),
      span: 6,
    },
    {
      id: "employee.aliyahDate",
      kind: "date",
      labelKey: "f.employee.aliyahDate",
      helpKey: "f.employee.aliyahDate.help",
      calendarStartYear: 2020,
      when: isId,
      validate: firstOf(
        validDate(),
        notFuture(),
        notBeforeField("employee.birthDate", "err.date.beforeBirth"),
      ),
      span: 6,
    },
  ],
}

const stepContact: Step = {
  id: "contact",
  titleKey: "step.contact.title",
  introKey: "step.contact.intro",
  fields: [
    { id: "contact.section.address", kind: "section", contentKey: "contact.section.address" },
    { id: "employee.city", kind: "text", labelKey: "f.employee.city", required: true, maxLength: 60, span: 6, suggestionsSource: "cities" },
    { id: "employee.street", kind: "text", labelKey: "f.employee.street", required: true, maxLength: 80, span: 6 },
    { id: "employee.houseNum", kind: "text", labelKey: "f.employee.houseNum", required: true, maxLength: 10, span: 3 },
    {
      id: "employee.zip",
      kind: "text",
      labelKey: "f.employee.zip",
      inputMode: "numeric",
      inputFilter: "digits",
      pattern: "[0-9]*",
      maxLength: 7,
      validate: israeliZip(),
      span: 3,
    },
    { id: "contact.section.reach", kind: "section", contentKey: "contact.section.reach" },
    {
      id: "employee.mobile",
      kind: "text",
      labelKey: "f.employee.mobile",
      required: true,
      inputMode: "tel",
      inputFilter: "phone",
      pattern: "[0-9+\\-\\s]*",
      autoComplete: "tel",
      maxLength: 15,
      validate: israeliPhone({ mobile: true }),
      span: 6,
    },
    {
      id: "employee.email",
      kind: "text",
      labelKey: "f.employee.email",
      helpKey: "f.employee.email.help",
      inputMode: "email",
      autoComplete: "email",
      maxLength: 254,
      validate: email(),
      span: 6,
    },
  ],
}

const stepStatus: Step = {
  id: "status",
  titleKey: "step.status.title",
  introKey: "step.status.intro",
  fields: [
    { id: "status.section.personal", kind: "section", contentKey: "status.section.personal" },
    {
      id: "employee.sex",
      kind: "radio",
      labelKey: "f.employee.sex",
      helpKey: "f.employee.sex.help",
      required: true,
      options: [
        { value: "male", labelKey: "opt.sex.male" },
        { value: "female", labelKey: "opt.sex.female" },
      ],
      span: 12,
    },
    {
      id: "employee.maritalStatus",
      kind: "radio",
      labelKey: "f.employee.maritalStatus",
      required: true,
      options: [
        { value: "single", labelKey: "opt.marital.single" },
        { value: "married", labelKey: "opt.marital.married" },
        { value: "divorced", labelKey: "opt.marital.divorced" },
        { value: "widowed", labelKey: "opt.marital.widowed" },
        { value: "separated", labelKey: "opt.marital.separated" },
      ],
      span: 12,
    },
    {
      id: "employee.separatedCertificate",
      kind: "checkbox",
      labelKey: "f.employee.separatedCertificate",
      helpKey: "f.employee.separatedCertificate.help",
      when: (s) => s.values["employee.maritalStatus"] === "separated",
      span: 12,
    },
    { id: "status.section.residence", kind: "section", contentKey: "status.section.residence", when: isId },
    {
      id: "employee.ilResident",
      kind: "radio",
      labelKey: "f.employee.ilResident",
      helpKey: "f.employee.ilResident.help",
      when: isId,
      required: true,
      options: yesNo,
      span: 12,
    },
    {
      id: "employee.kibbutzMember",
      kind: "radio",
      labelKey: "f.employee.kibbutzMember",
      when: isId,
      required: true,
      options: yesNo,
      span: 6,
    },
    {
      id: "employee.kibbutzIncome",
      kind: "radio",
      labelKey: "f.employee.kibbutzIncome",
      when: (s) => isId(s) && asBool(s.values["employee.kibbutzMember"]),
      required: true,
      options: yesNo,
      span: 6,
    },
    { id: "status.section.fund", kind: "section", contentKey: "status.section.fund" },
    {
      id: "employee.healthFundMember",
      kind: "radio",
      labelKey: "f.employee.healthFundMember",
      required: true,
      options: yesNo,
      span: 6,
    },
    {
      id: "employee.healthFundName",
      kind: "radio",
      labelKey: "f.employee.healthFundName",
      when: (s) => asBool(s.values["employee.healthFundMember"]),
      required: true,
      options: [
        { value: "clalit", labelKey: "opt.fund.clalit" },
        { value: "maccabi", labelKey: "opt.fund.maccabi" },
        { value: "meuhedet", labelKey: "opt.fund.meuhedet" },
        { value: "leumit", labelKey: "opt.fund.leumit" },
      ],
      span: 6,
    },

    /* ---- spouse, inline in the same step (only when married) ---- */
    { id: "spouse.divider", kind: "section", contentKey: "spouse.divider", when: isMarried },
    {
      id: "spouse.firstName",
      kind: "text",
      labelKey: "f.spouse.firstName",
      when: isMarried,
      required: true,
      maxLength: 60,
      span: 6,
    },
    {
      id: "spouse.lastName",
      kind: "text",
      labelKey: "f.spouse.lastName",
      when: isMarried,
      required: true,
      maxLength: 60,
      span: 6,
    },
    {
      id: "spouse.idNum",
      kind: "text",
      labelKey: "f.spouse.idNum",
      when: isMarried,
      required: true,
      inputMode: "numeric",
      inputFilter: "digits",
      pattern: "[0-9]*",
      maxLength: 9,
      validate: firstOf(israeliId(), distinctFrom(["employee.idNum"], { "employee.idNum": "employee.idNum" })),
      span: 6,
    },
    {
      id: "spouse.birthDate",
      kind: "date",
      labelKey: "f.spouse.birthDate",
      when: isMarried,
      required: true,
      calendarStartYear: 1990,
      validate: firstOf(validDate(), notFuture(), ageAtTaxYearEndBetween(14, 120)),
      span: 6,
    },
    {
      id: "spouse.hasIncome",
      kind: "radio",
      labelKey: "f.spouse.hasIncome",
      when: isMarried,
      required: true,
      options: [
        { value: "no", labelKey: "opt.spouseIncome.none" },
        { value: "yes", labelKey: "opt.spouseIncome.has" },
      ],
      span: 12,
    },
    {
      id: "spouse.incomeTypes",
      kind: "checkboxGroup",
      labelKey: "f.spouse.incomeTypes",
      when: (s) => isMarried(s) && s.values["spouse.hasIncome"] === "yes",
      required: true,
      options: [
        { value: "work", labelKey: "opt.spouseIncomeType.work" },
        { value: "other", labelKey: "opt.spouseIncomeType.other" },
      ],
      validate: atLeastOne(),
      span: 12,
    },
    {
      id: "spouse.noIncomeDeclaration",
      kind: "checkbox",
      labelKey: "f.spouse.noIncomeDeclaration",
      helpKey: "f.spouse.noIncomeDeclaration.help",
      when: (s) => isMarried(s) && s.values["spouse.hasIncome"] === "no",
      span: 12,
    },
  ],
}

const stepChildren: Step = {
  id: "children",
  titleKey: "step.children.title",
  introKey: "step.children.intro",
  when: isId,
  skipReasonKey: "step.children.skip",
  fields: [
    {
      id: "children",
      kind: "repeat",
      labelKey: "f.children.list",
      rowTitleKey: "f.children.row",
      addKey: "f.children.add",
      maxItems: 12,
      fields: [
        { id: "children.name", kind: "text", labelKey: "f.children.name", required: true, maxLength: 60 },
        {
          id: "children.idNum",
          kind: "text",
          labelKey: "f.children.idNum",
          required: true,
          inputMode: "numeric",
          inputFilter: "digits",
          pattern: "[0-9]*",
          maxLength: 9,
          validate: firstOf(israeliId(), distinctFrom(["employee.idNum", "spouse.idNum"])),
        },
        {
          id: "children.birthDate",
          kind: "date",
          labelKey: "f.children.birthDate",
          required: true,
          calendarStartYear: 2015,
          validate: firstOf(validDate(), notFuture(), childAgeAtTaxYearEnd()),
        },
        {
          id: "children.custody",
          kind: "checkbox",
          labelKey: "f.children.custody",
          helpKey: "f.children.custody.help",
          initial: true,
        },
        {
          id: "children.allowance",
          kind: "checkbox",
          labelKey: "f.children.allowance",
          helpKey: "f.children.allowance.help",
        },
      ],
    },
  ],
}

const stepIncome: Step = {
  id: "income",
  titleKey: "step.income.title",
  introKey: "step.income.intro",
  fields: [
    { id: "income.section.pay", kind: "section", contentKey: "income.section.pay" },
    {
      id: "income.salaryTypes",
      kind: "checkboxGroup",
      labelKey: "f.income.salaryTypes",
      helpKey: "f.income.salaryTypes.help",
      required: true,
      options: [
        { value: "monthly", labelKey: "opt.salary.monthly", hintKey: "opt.salary.monthly.hint" },
        { value: "additional", labelKey: "opt.salary.additional", hintKey: "opt.salary.additional.hint" },
        { value: "partial", labelKey: "opt.salary.partial", hintKey: "opt.salary.partial.hint" },
        { value: "daily", labelKey: "opt.salary.daily", hintKey: "opt.salary.daily.hint" },
        { value: "allowance", labelKey: "opt.salary.allowance" },
        { value: "scholarship", labelKey: "opt.salary.scholarship" },
      ],
      validate: firstOf(atLeastOne(), atMostOneOf(["monthly", "additional", "partial", "daily"])),
      span: 12,
    },
    {
      id: "income.secondJobWarning",
      kind: "static",
      contentKey: "income.secondJobWarning",
      variant: "warning",
      when: (s) =>
        !asBool(s.values["coord.request"]) &&
        Array.isArray(s.values["income.salaryTypes"]) &&
        (s.values["income.salaryTypes"] as string[]).includes("additional"),
    },
    {
      id: "income.startDate",
      kind: "date",
      labelKey: "f.income.startDate",
      helpKey: "f.income.startDate.help",
      required: true,
      min: `${TAX_YEAR}-01-01`,
      max: `${TAX_YEAR}-12-31`,
      validate: firstOf(validDate(), notFuture(), dateInTaxYear((s) => s.meta.taxYear)),
      span: 6,
    },
    { id: "income.section.other", kind: "section", contentKey: "income.section.other" },
    {
      id: "other.hasOther",
      kind: "radio",
      labelKey: "f.other.hasOther",
      helpKey: "f.other.hasOther.help",
      required: true,
      options: [
        { value: false, labelKey: "opt.other.none" },
        { value: true, labelKey: "opt.other.has" },
      ],
      span: 12,
    },
    {
      id: "other.types",
      kind: "checkboxGroup",
      labelKey: "f.other.types",
      when: (s) => asBool(s.values["other.hasOther"]),
      required: true,
      validate: atLeastOne(),
      options: [
        { value: "monthly", labelKey: "opt.salary.monthly", hintKey: "opt.salary.monthly.hint" },
        { value: "additional", labelKey: "opt.salary.additional", hintKey: "opt.salary.additional.hint" },
        { value: "partial", labelKey: "opt.salary.partial", hintKey: "opt.salary.partial.hint" },
        { value: "daily", labelKey: "opt.salary.daily", hintKey: "opt.salary.daily.hint" },
        { value: "allowance", labelKey: "opt.salary.allowance" },
        { value: "scholarship", labelKey: "opt.salary.scholarship" },
        { value: "other", labelKey: "opt.other.source" },
      ],
      span: 12,
    },
    {
      id: "other.source",
      kind: "text",
      labelKey: "f.other.source",
      when: (s) => Array.isArray(s.values["other.types"]) && (s.values["other.types"] as string[]).includes("other"),
      required: true,
      maxLength: 100,
      span: 12,
    },
    {
      id: "other.creditsElsewhere",
      kind: "radio",
      labelKey: "f.other.creditsElsewhere",
      helpKey: "f.other.creditsElsewhere.help",
      when: (s) => asBool(s.values["other.hasOther"]),
      required: true,
      options: [
        { value: "no", labelKey: "opt.credits.mine" },
        { value: "yes", labelKey: "opt.credits.elsewhere" },
      ],
      span: 12,
    },
    {
      id: "other.studyFund",
      kind: "checkbox",
      labelKey: "f.other.studyFund",
      when: (s) => asBool(s.values["other.hasOther"]),
      span: 12,
    },
    {
      id: "other.pension",
      kind: "checkbox",
      labelKey: "f.other.pension",
      when: (s) => asBool(s.values["other.hasOther"]),
      span: 12,
    },
  ],
}

const creditToggle = (
  id: string,
  labelKey: MessageKey,
  extra: Partial<FieldDef> = {},
): FieldDef => ({
  id: `credits.${id}`,
  kind: "checkbox",
  labelKey,
  when: (s) => !creditsBlocked(s),
  span: 12,
  ...extra,
})

const stepCredits: Step = {
  id: "credits",
  titleKey: "step.credits.title",
  introKey: "step.credits.intro",
  fields: [
    {
      id: "credits.blocked",
      kind: "static",
      contentKey: "credits.blocked",
      variant: "warning",
      when: creditsBlocked,
    },
    { id: "credits.section.personal", kind: "section", contentKey: "credits.section.personal", when: (s) => !creditsBlocked(s) },
    creditToggle("resident", "f.credits.resident", { helpKey: "f.credits.resident.help" }),
    creditToggle("disabled", "f.credits.disabled"),
    {
      id: "credits.disabledMonthly",
      kind: "checkbox",
      labelKey: "f.credits.disabledMonthly",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.disabled"]),
      span: 12,
    },
    creditToggle("locality", "f.credits.locality", { helpKey: "f.credits.locality.help" }),
    {
      id: "credits.localityName",
      kind: "text",
      labelKey: "f.credits.localityName",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.locality"]),
      required: true,
      maxLength: 60,
      span: 6,
    },
    {
      id: "credits.localityFrom",
      kind: "date",
      labelKey: "f.credits.localityFrom",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.locality"]),
      required: true,
      validate: firstOf(validDate(), notFuture()),
      span: 6,
    },
    creditToggle("immigrant", "f.credits.immigrant", { helpKey: "f.credits.immigrant.help" }),
    {
      id: "credits.immigrantType",
      kind: "radio",
      labelKey: "f.credits.immigrantType",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.immigrant"]),
      required: true,
      options: [
        { value: "immigrant", labelKey: "opt.immigrant.oleh" },
        { value: "returning", labelKey: "opt.immigrant.returning" },
      ],
      span: 12,
    },
    {
      id: "credits.immigrantFrom",
      kind: "date",
      labelKey: "f.credits.immigrantFrom",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.immigrant"]),
      required: true,
      validate: firstOf(validDate(), notFuture()),
      span: 6,
    },
    {
      id: "credits.immigrantNoIncomeUntil",
      kind: "date",
      labelKey: "f.credits.immigrantNoIncomeUntil",
      helpKey: "f.credits.immigrantNoIncomeUntil.help",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.immigrant"]),
      validate: firstOf(validDate(), notFuture(), dateInTaxYear((s) => s.meta.taxYear)),
      span: 6,
    },
    { id: "credits.section.family", kind: "section", contentKey: "credits.section.family", when: (s) => !creditsBlocked(s) },
    creditToggle("incomelessSpouse", "f.credits.incomelessSpouse", {
      when: (s) =>
        !creditsBlocked(s) && isMarried(s) && s.values["spouse.hasIncome"] === "no",
    }),
    creditToggle("singleParentSeparate", "f.credits.singleParentSeparate", {
      validate: (value, s) => {
        if (value !== true) return []
        if (!isMarried(s) && hasChildWithAllowance(s)) return []
        return [issue("", "err.credits.singleParentEligibility", "credits.singleParentEligibility", "warning")]
      },
    }),
    creditToggle("childrenCustody", "f.credits.childrenCustody", {
      helpKey: "f.credits.childrenCustody.help",
      when: (s) => !creditsBlocked(s) && isId(s),
      validate: (value, s) => {
        if (value !== true) return []
        const eligible =
          (!isMarried(s) && hasChildWithAllowance(s) && hasChildInCustody(s)) ||
          (s.values["employee.sex"] === "female" && isMarried(s)) ||
          asBool(s.values["credits.soleParent"])
        return eligible ? [] : [issue("", "err.credits.childrenEligibility", "credits.childrenEligibility", "warning")]
      },
    }),
    creditToggle("toddlers", "f.credits.toddlers", {
      helpKey: "f.credits.toddlers.help",
      when: (s) => !creditsBlocked(s) && isId(s),
      validate: (value, s) => {
        if (value !== true) return []
        const sex = s.values["employee.sex"]
        const marital = s.values["employee.maritalStatus"]
        const eligible =
          (sex === "male" && marital === "married") ||
          (!!sex && !!marital && marital !== "married" && !asBool(s.values["credits.childrenCustody"])) ||
          (sex === "female" && !!marital && marital !== "married" && hasChildOutsideCustody(s)) ||
          asBool(s.values["credits.soleParent"])
        return eligible ? [] : [issue("", "err.credits.toddlersEligibility", "credits.toddlersEligibility", "warning")]
      },
    }),
    creditToggle("soleParent", "f.credits.soleParent", {
      validate: (value, s) => {
        if (value !== true) return []
        if (asBool(s.values["credits.childrenCustody"]) || asBool(s.values["credits.toddlers"])) return []
        return [issue("", "err.credits.soleParentNeedsChildren", "credits.soleParentNeedsChildren", "warning")]
      },
    }),
    creditToggle("nonCustodySupport", "f.credits.nonCustodySupport"),
    creditToggle("disabledChild", "f.credits.disabledChild"),
    {
      id: "credits.disabledChildCount",
      kind: "text",
      labelKey: "f.credits.disabledChildCount",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.disabledChild"]),
      required: true,
      inputMode: "numeric",
      inputFilter: "digits",
      pattern: "[0-9]*",
      maxLength: 2,
      validate: integerRange(1, 20),
      span: 6,
    },
    creditToggle("alimony", "f.credits.alimony"),
    { id: "credits.section.service", kind: "section", contentKey: "credits.section.service", when: (s) => !creditsBlocked(s) },
    creditToggle("youngEmployee", "f.credits.youngEmployee", { validate: youngEmployeeEligible() }),
    creditToggle("discharged", "f.credits.discharged"),
    {
      id: "credits.serviceStart",
      kind: "date",
      labelKey: "f.credits.serviceStart",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.discharged"]),
      required: true,
      validate: firstOf(validDate(), notFuture(), beforeField("credits.serviceEnd")),
      span: 6,
    },
    {
      id: "credits.serviceEnd",
      kind: "date",
      labelKey: "f.credits.serviceEnd",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.discharged"]),
      required: true,
      validate: firstOf(validDate(), notFuture(), afterField("credits.serviceStart")),
      span: 6,
    },
    creditToggle("studies", "f.credits.studies"),
    creditToggle("reserve", "f.credits.reserve"),
    {
      id: "credits.reserveDays",
      kind: "text",
      labelKey: "f.credits.reserveDays",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.reserve"]),
      required: true,
      inputMode: "numeric",
      inputFilter: "digits",
      pattern: "[0-9]*",
      maxLength: 3,
      validate: integerRange(1, 366),
      span: 6,
    },

    /* ---- tax coordination, inline ---- */
    { id: "coord.divider", kind: "section", contentKey: "coord.divider" },
    {
      id: "coord.request",
      kind: "checkbox",
      labelKey: "f.coord.request",
      helpKey: "f.coord.request.help",
      span: 12,
    },
    {
      id: "coord.reason",
      kind: "radio",
      labelKey: "f.coord.reason",
      when: (s) => asBool(s.values["coord.request"]),
      required: true,
      options: [
        { value: "no-previous-income", labelKey: "opt.coord.noPrevious" },
        { value: "other-incomes", labelKey: "opt.coord.otherIncomes" },
        { value: "approved", labelKey: "opt.coord.approved" },
      ],
      span: 12,
    },
    {
      id: "coord.noIncomeUntil",
      kind: "date",
      labelKey: "f.coord.noIncomeUntil",
      when: (s) => asBool(s.values["coord.request"]) && s.values["coord.reason"] === "no-previous-income",
      required: true,
      min: `${TAX_YEAR}-01-01`,
      max: `${TAX_YEAR}-12-31`,
      validate: firstOf(validDate(), notFuture(), dateInTaxYear((s) => s.meta.taxYear)),
      span: 6,
    },
    {
      id: "coord.employers",
      kind: "repeat",
      labelKey: "f.coord.employers",
      rowTitleKey: "f.coord.row",
      addKey: "f.coord.add",
      when: (s) => asBool(s.values["coord.request"]) && s.values["coord.reason"] === "other-incomes",
      required: true,
      minItems: 1,
      maxItems: 6,
      fields: [
        { id: "coord.name", kind: "text", labelKey: "f.coord.name", required: true, maxLength: 80 },
        { id: "coord.address", kind: "text", labelKey: "f.coord.address", required: true, maxLength: 120 },
        {
          id: "coord.fileNum",
          kind: "text",
          labelKey: "f.coord.fileNum",
          required: true,
          inputMode: "numeric",
          inputFilter: "digits",
          pattern: "[0-9]*",
          maxLength: 9,
          validate: deductionFileNumber(),
        },
        {
          id: "coord.incomeType",
          kind: "radio",
          labelKey: "f.coord.incomeType",
          required: true,
          options: [
            { value: "work", labelKey: "opt.coordType.work" },
            { value: "allowance", labelKey: "opt.coordType.allowance" },
            { value: "scholarship", labelKey: "opt.coordType.scholarship" },
            { value: "other", labelKey: "opt.coordType.other" },
          ],
        },
        {
          id: "coord.monthlyIncome",
          kind: "text",
          labelKey: "f.coord.monthlyIncome",
          required: true,
          inputMode: "decimal",
          inputFilter: "decimal",
          pattern: "[0-9]*[.,]?[0-9]{0,2}",
          maxLength: 12,
          validate: decimalRange(1, 10_000_000),
        },
        {
          id: "coord.monthlyTax",
          kind: "text",
          labelKey: "f.coord.monthlyTax",
          required: true,
          inputMode: "decimal",
          inputFilter: "decimal",
          pattern: "[0-9]*[.,]?[0-9]{0,2}",
          maxLength: 12,
          validate: decimalRange(0, 10_000_000),
        },
      ],
    },
    {
      id: "coord.approved",
      kind: "checkbox",
      labelKey: "f.coord.approved",
      helpKey: "f.coord.approved.help",
      when: (s) => asBool(s.values["coord.request"]) && s.values["coord.reason"] === "approved",
      span: 12,
    },
  ],
}

const stepAttachments: Step = {
  id: "attach",
  titleKey: "step.attach.title",
  introKey: "step.attach.intro",
  fields: [],
}

const stepFinish: Step = {
  id: "finish",
  titleKey: "step.finish.title",
  introKey: "step.finish.intro",
  fields: [
    { id: "sign.declaration", kind: "static", contentKey: "sign.declaration", variant: "warning" },
    {
      id: "sign.itemsChecklist",
      kind: "static",
      contentKey: "sign.documents",
      variant: "info",
    },
    {
      id: "sign.signature",
      kind: "signature",
      labelKey: "f.sign.signature",
      helpKey: "f.sign.signature.help",
      required: true,
      validate: signature(),
      span: 12,
    },
    {
      id: "sign.date",
      kind: "date",
      labelKey: "f.sign.date",
      required: true,
      when: (s) => Boolean(s.values["sign.signature"]),
      validate: firstOf(validDate(), notFuture()),
      span: 6,
    },
  ],
}

export const schema: FormSchema = {
  id: "itc-101",
  taxYear: 2026,
  schemaVersion: 2,
  declarationVersion: "2026-he-1",
  steps: [
    stepEmployer,
    stepIdentity,
    stepContact,
    stepStatus,
    stepChildren,
    stepIncome,
    stepCredits,
    stepAttachments,
    stepFinish,
  ],
  allFields: [],
}

// Flatten once; keep the same object identity for `when`/`validate` closures.
schema.allFields = schema.steps.flatMap((s) => s.fields)

export function fieldById(id: string): FieldDef | undefined {
  return schema.allFields.find((f) => f.id === id)
}

export function stepIndexOf(id: string): number {
  return schema.steps.findIndex((s) => s.id === id)
}

export const stepIds = schema.steps.map((s) => s.id)
export type StepIdUnion = (typeof stepIds)[number]
