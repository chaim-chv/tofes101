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
  ageBetween,
  atLeastOne,
  dateInTaxYear,
  distinctFrom,
  digitsOnly,
  email,
  firstOf,
  israeliId,
  israeliPhone,
  notFuture,
} from "./validators"
import { asBool } from "./values"
import { hasOtherIncome, spousePresent } from "./derive"

const yesNo = [
  { value: true, labelKey: "opt.yes" },
  { value: false, labelKey: "opt.no" },
] as const

const isId = (s: FormState) => s.values["employee.idKind"] !== "passport"
const isPassport = (s: FormState) => s.values["employee.idKind"] === "passport"
const isMarried = (s: FormState) => spousePresent(s)
const creditsBlocked = (s: FormState) => hasOtherIncome(s) && s.values["other.creditsElsewhere"] === "yes"

/* ------------------------------------------------------------------ steps */

const stepIntro: Step = {
  id: "intro",
  titleKey: "step.intro.title",
  introKey: "step.intro.body",
  fields: [
    { id: "intro.privacy", kind: "static", contentKey: "intro.privacy", variant: "success" },
    { id: "intro.what", kind: "static", contentKey: "intro.what", variant: "info" },
    { id: "intro.time", kind: "static", contentKey: "intro.time", variant: "info" },
  ],
}

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
      autoComplete: "tel",
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
      maxLength: 9,
      validate: firstOf(digitsOnly()),
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
      autoComplete: "bday",
      validate: firstOf(notFuture(), ageBetween(14, 120, "employee.birthDate")),
      span: 6,
    },
    {
      id: "employee.aliyahDate",
      kind: "date",
      labelKey: "f.employee.aliyahDate",
      helpKey: "f.employee.aliyahDate.help",
      when: isId,
      validate: firstOf(notFuture()),
      span: 6,
    },
  ],
}

const stepContact: Step = {
  id: "contact",
  titleKey: "step.contact.title",
  introKey: "step.contact.intro",
  fields: [
    { id: "employee.city", kind: "text", labelKey: "f.employee.city", required: true, maxLength: 60, span: 6 },
    { id: "employee.street", kind: "text", labelKey: "f.employee.street", required: true, maxLength: 80, span: 6 },
    { id: "employee.houseNum", kind: "text", labelKey: "f.employee.houseNum", required: true, maxLength: 10, span: 3 },
    { id: "employee.zip", kind: "text", labelKey: "f.employee.zip", inputMode: "numeric", maxLength: 7, validate: digitsOnly(), span: 3 },
    {
      id: "employee.mobile",
      kind: "text",
      labelKey: "f.employee.mobile",
      required: true,
      inputMode: "tel",
      autoComplete: "tel",
      maxLength: 12,
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
    { id: "spouse.divider", kind: "static", contentKey: "spouse.divider", when: isMarried },
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
      validate: firstOf(notFuture()),
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
      labelKey: "f.children",
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
          maxLength: 9,
          validate: firstOf(israeliId(), distinctFrom(["employee.idNum", "spouse.idNum"])),
        },
        {
          id: "children.birthDate",
          kind: "date",
          labelKey: "f.children.birthDate",
          required: true,
          validate: firstOf(notFuture()),
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
    {
      id: "income.salaryTypes",
      kind: "checkboxGroup",
      labelKey: "f.income.salaryTypes",
      helpKey: "f.income.salaryTypes.help",
      required: true,
      options: [
        { value: "monthly", labelKey: "opt.salary.monthly" },
        { value: "additional", labelKey: "opt.salary.additional" },
        { value: "partial", labelKey: "opt.salary.partial" },
        { value: "daily", labelKey: "opt.salary.daily" },
        { value: "allowance", labelKey: "opt.salary.allowance" },
        { value: "scholarship", labelKey: "opt.salary.scholarship" },
      ],
      validate: atLeastOne(),
      span: 12,
    },
    {
      id: "income.secondJobWarning",
      kind: "static",
      contentKey: "income.secondJobWarning",
      variant: "warning",
      when: (s) => Array.isArray(s.values["income.salaryTypes"]) && (s.values["income.salaryTypes"] as string[]).includes("additional"),
    },
    {
      id: "income.startDate",
      kind: "date",
      labelKey: "f.income.startDate",
      helpKey: "f.income.startDate.help",
      required: true,
      validate: firstOf(notFuture(), dateInTaxYear((s) => s.meta.taxYear)),
      span: 6,
    },
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
        { value: "monthly", labelKey: "opt.salary.monthly" },
        { value: "additional", labelKey: "opt.salary.additional" },
        { value: "partial", labelKey: "opt.salary.partial" },
        { value: "daily", labelKey: "opt.salary.daily" },
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
      validate: firstOf(notFuture()),
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
      validate: firstOf(notFuture()),
      span: 6,
    },
    {
      id: "credits.immigrantNoIncomeUntil",
      kind: "date",
      labelKey: "f.credits.immigrantNoIncomeUntil",
      helpKey: "f.credits.immigrantNoIncomeUntil.help",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.immigrant"]),
      span: 6,
    },
    creditToggle("incomelessSpouse", "f.credits.incomelessSpouse"),
    creditToggle("singleParentSeparate", "f.credits.singleParentSeparate"),
    creditToggle("childrenCustody", "f.credits.childrenCustody", {
      helpKey: "f.credits.childrenCustody.help",
      when: (s) => !creditsBlocked(s) && isId(s),
    }),
    creditToggle("toddlers", "f.credits.toddlers", {
      helpKey: "f.credits.toddlers.help",
      when: (s) => !creditsBlocked(s) && isId(s),
    }),
    creditToggle("soleParent", "f.credits.soleParent"),
    creditToggle("nonCustodySupport", "f.credits.nonCustodySupport"),
    creditToggle("disabledChild", "f.credits.disabledChild"),
    {
      id: "credits.disabledChildCount",
      kind: "text",
      labelKey: "f.credits.disabledChildCount",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.disabledChild"]),
      required: true,
      inputMode: "numeric",
      maxLength: 2,
      validate: digitsOnly(),
      span: 6,
    },
    creditToggle("alimony", "f.credits.alimony"),
    creditToggle("youngEmployee", "f.credits.youngEmployee"),
    creditToggle("discharged", "f.credits.discharged"),
    {
      id: "credits.serviceStart",
      kind: "date",
      labelKey: "f.credits.serviceStart",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.discharged"]),
      required: true,
      validate: firstOf(notFuture()),
      span: 6,
    },
    {
      id: "credits.serviceEnd",
      kind: "date",
      labelKey: "f.credits.serviceEnd",
      when: (s) => !creditsBlocked(s) && asBool(s.values["credits.discharged"]),
      required: true,
      validate: firstOf(afterField("credits.serviceStart")),
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
      maxLength: 3,
      validate: digitsOnly(),
      span: 6,
    },

    /* ---- tax coordination, inline ---- */
    { id: "coord.divider", kind: "static", contentKey: "coord.divider" },
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
      validate: firstOf(notFuture()),
      span: 6,
    },
    {
      id: "coord.employers",
      kind: "repeat",
      labelKey: "f.coord.employers",
      rowTitleKey: "f.coord.row",
      addKey: "f.coord.add",
      when: (s) => asBool(s.values["coord.request"]) && s.values["coord.reason"] === "other-incomes",
      maxItems: 6,
      fields: [
        { id: "coord.name", kind: "text", labelKey: "f.coord.name", required: true, maxLength: 80 },
        { id: "coord.address", kind: "text", labelKey: "f.coord.address", maxLength: 120 },
        {
          id: "coord.fileNum",
          kind: "text",
          labelKey: "f.coord.fileNum",
          inputMode: "numeric",
          maxLength: 9,
          validate: digitsOnly(),
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
        { id: "coord.monthlyIncome", kind: "text", labelKey: "f.coord.monthlyIncome", inputMode: "decimal", maxLength: 12 },
        { id: "coord.monthlyTax", kind: "text", labelKey: "f.coord.monthlyTax", inputMode: "decimal", maxLength: 12 },
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

const stepReview: Step = {
  id: "review",
  titleKey: "step.review.title",
  introKey: "step.review.intro",
  fields: [{ id: "review.summary", kind: "static", contentKey: "review.summary" }],
}

const stepSign: Step = {
  id: "sign",
  titleKey: "step.sign.title",
  introKey: "step.sign.intro",
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
      span: 12,
    },
    {
      id: "sign.date",
      kind: "date",
      labelKey: "f.sign.date",
      required: true,
      when: (s) => Boolean(s.values["sign.signature"]),
      validate: firstOf(notFuture()),
      span: 6,
    },
  ],
}

export const schema: FormSchema = {
  id: "itc-101",
  taxYear: 2026,
  schemaVersion: 1,
  declarationVersion: "2026-he-1",
  steps: [
    stepIntro,
    stepEmployer,
    stepIdentity,
    stepContact,
    stepStatus,
    stepChildren,
    stepIncome,
    stepCredits,
    stepAttachments,
    stepReview,
    stepSign,
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
