/**
 * Documents checklist — derived, never hand-maintained.
 *
 * Every row here is a consequence of an answer (see kb/field/101-documents.md and
 * the per-item table in kb/field/101-credit-items-map.md). The user prints this
 * list before signing, so it must re-derive live when an answer changes.
 */
import type { FormState } from "./types"
import type { MessageKey } from "~/locales"
import { asBool, asString } from "./values"

export type DocumentRequirement = {
  id: string
  labelKey: MessageKey
  /** Where the requirement comes from, for the "why" line. */
  becauseKey: MessageKey
  required: boolean
}

export function documentChecklist(state: FormState): DocumentRequirement[] {
  const out: DocumentRequirement[] = []
  const add = (r: DocumentRequirement) => out.push(r)

  const isPassport = state.values["employee.idKind"] === "passport"

  if (isPassport) {
    add({ id: "passport", labelKey: "doc.passport", becauseKey: "doc.because.passport", required: true })
    add({ id: "residence", labelKey: "doc.residence", becauseKey: "doc.because.passport", required: true })
  } else {
    add({ id: "id", labelKey: "doc.id", becauseKey: "doc.because.id", required: false })
  }

  if (state.values["employee.maritalStatus"] === "separated") {
    add({ id: "assessor", labelKey: "doc.assessor", becauseKey: "doc.because.separated", required: true })
  }

  if (asBool(state.values["credits.disabled"])) {
    add({ id: "disability", labelKey: "doc.disability", becauseKey: "doc.because.disabled", required: true })
    if (asBool(state.values["credits.disabledMonthly"])) {
      add({ id: "stipend", labelKey: "doc.stipend", becauseKey: "doc.because.disabled", required: true })
    }
  }

  if (asBool(state.values["credits.locality"])) {
    add({ id: "locality", labelKey: "doc.locality", becauseKey: "doc.because.locality", required: true })
  }

  if (asBool(state.values["credits.immigrant"])) {
    const type = state.values["credits.immigrantType"]
    add({
      id: "immigrant",
      labelKey: type === "returning" ? "doc.returning" : "doc.oleh",
      becauseKey: "doc.because.immigrant",
      required: true,
    })
  }

  if (asBool(state.values["credits.disabledChild"])) {
    add({ id: "disabledChild", labelKey: "doc.disabledChild", becauseKey: "doc.because.disabledChild", required: true })
  }

  if (asBool(state.values["credits.nonCustodySupport"]) || asBool(state.values["credits.alimony"])) {
    add({ id: "judgment", labelKey: "doc.judgment", becauseKey: "doc.because.judgment", required: true })
  }

  if (asBool(state.values["credits.discharged"])) {
    add({ id: "discharge", labelKey: "doc.discharge", becauseKey: "doc.because.discharged", required: false })
  }

  if (asBool(state.values["credits.studies"])) {
    add({ id: "form119", labelKey: "doc.form119", becauseKey: "doc.because.studies", required: true })
  }

  if (asBool(state.values["credits.reserve"])) {
    add({ id: "reserve", labelKey: "doc.reserve", becauseKey: "doc.because.reserve", required: false })
  }

  if (asBool(state.values["coord.request"])) {
    const reason = asString(state.values["coord.reason"])
    if (reason === "no-previous-income") {
      add({ id: "noIncome", labelKey: "doc.noIncome", becauseKey: "doc.because.coordination", required: true })
    } else if (reason === "other-incomes") {
      add({ id: "payslips", labelKey: "doc.payslips", becauseKey: "doc.because.coordination", required: true })
    } else if (reason === "approved") {
      add({ id: "approval", labelKey: "doc.approval", becauseKey: "doc.because.coordination", required: true })
    }
  }

  return out
}

export function requiredDocuments(state: FormState): DocumentRequirement[] {
  return documentChecklist(state).filter((d) => d.required)
}
