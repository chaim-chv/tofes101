/**
 * Documents checklist — derived, never hand-maintained.
 *
 * Every row here is a consequence of an answer (see kb/field/101-documents.md and
 * the per-item table in kb/field/101-credit-items-map.md). The same list drives
 * the finish screen, the PDF/print checklist and the "attached" status, so the
 * user sees one set of requirements everywhere.
 *
 * Levels are about *why* the document is needed:
 *  - identity     — the form must be accompanied by it (ID card incl. ספח, or passport + permit);
 *  - credit       — needed to support a credit/status answer;
 *  - coordination — needed for the tax-coordination request.
 *
 * There is no "recommended" level on purpose: if a row is shown, it is needed.
 */
import type { FormState } from "./types"
import type { MessageKey } from "~/locales"
import type { SlotId } from "~/storage/files"
import { asBool, asString } from "./values"

export type DocumentLevel = "identity" | "credit" | "coordination"

export type DocumentSlotRule = {
  /** Upload slots that satisfy the requirement. */
  ids: SlotId[]
  /**
   * `any`: one slot is enough. The ID is one document on paper ("צילום תעודת
   * זהות כולל ספח"), and a single multi-page PDF may contain front, back and
   * ספח — requiring both slots would mark a complete scan as missing.
   */
  match: "any" | "all"
}

export type DocumentRequirement = {
  id: string
  labelKey: MessageKey
  /** Where the requirement comes from, for the "why" line. */
  becauseKey: MessageKey
  level: DocumentLevel
  /** Upload slots that satisfy it, when the app can carry the file. */
  slots?: DocumentSlotRule
  /** No upload slot exists in this build — the document is handed to the employer. */
  handover?: boolean
  /** Extra qualification shown under the row (e.g. the ID first-filing note). */
  noteKey?: MessageKey
}

export type DocumentStatus = "attached" | "partial" | "missing" | "handover"

export function documentChecklist(state: FormState): DocumentRequirement[] {
  const out: DocumentRequirement[] = []
  const add = (r: DocumentRequirement) => out.push(r)

  const isPassport = state.values["employee.idKind"] === "passport"

  if (isPassport) {
    add({
      id: "passport",
      labelKey: "doc.passport",
      becauseKey: "doc.because.passport",
      level: "identity",
      slots: { ids: ["passport"], match: "all" },
    })
    add({
      id: "residence",
      labelKey: "doc.residence",
      becauseKey: "doc.because.passport",
      level: "identity",
      slots: { ids: ["residence"], match: "all" },
    })
  } else {
    add({
      id: "id",
      labelKey: "doc.id",
      becauseKey: "doc.because.id",
      level: "identity",
      slots: { ids: ["id-front", "id-annex"], match: "any" },
      noteKey: "doc.note.id",
    })
  }

  if (state.values["employee.maritalStatus"] === "separated") {
    add({ id: "assessor", labelKey: "doc.assessor", becauseKey: "doc.because.separated", level: "credit", handover: true })
  }

  if (asBool(state.values["credits.disabled"])) {
    add({ id: "disability", labelKey: "doc.disability", becauseKey: "doc.because.disabled", level: "credit", handover: true })
    if (asBool(state.values["credits.disabledMonthly"])) {
      add({ id: "stipend", labelKey: "doc.stipend", becauseKey: "doc.because.disabled", level: "credit", handover: true })
    }
  }

  if (asBool(state.values["credits.locality"])) {
    add({ id: "locality", labelKey: "doc.locality", becauseKey: "doc.because.locality", level: "credit", handover: true })
  }

  if (asBool(state.values["credits.immigrant"])) {
    const type = state.values["credits.immigrantType"]
    add({
      id: "immigrant",
      labelKey: type === "returning" ? "doc.returning" : "doc.oleh",
      becauseKey: "doc.because.immigrant",
      level: "credit",
      handover: true,
    })
  }

  if (asBool(state.values["credits.disabledChild"])) {
    add({
      id: "disabledChild",
      labelKey: "doc.disabledChild",
      becauseKey: "doc.because.disabledChild",
      level: "credit",
      handover: true,
    })
  }

  if (asBool(state.values["credits.nonCustodySupport"]) || asBool(state.values["credits.alimony"])) {
    add({ id: "judgment", labelKey: "doc.judgment", becauseKey: "doc.because.judgment", level: "credit", handover: true })
  }

  if (asBool(state.values["credits.discharged"])) {
    add({ id: "discharge", labelKey: "doc.discharge", becauseKey: "doc.because.discharged", level: "credit", handover: true })
  }

  if (asBool(state.values["credits.studies"])) {
    add({ id: "form119", labelKey: "doc.form119", becauseKey: "doc.because.studies", level: "credit", handover: true })
  }

  if (asBool(state.values["credits.reserve"])) {
    add({ id: "reserve", labelKey: "doc.reserve", becauseKey: "doc.because.reserve", level: "credit", handover: true })
  }

  if (asBool(state.values["coord.request"])) {
    const reason = asString(state.values["coord.reason"])
    if (reason === "no-previous-income") {
      add({
        id: "noIncome",
        labelKey: "doc.noIncome",
        becauseKey: "doc.because.coordination",
        level: "coordination",
        handover: true,
      })
    } else if (reason === "other-incomes") {
      add({
        id: "payslips",
        labelKey: "doc.payslips",
        becauseKey: "doc.because.coordination",
        level: "coordination",
        handover: true,
      })
    } else if (reason === "approved") {
      add({
        id: "approval",
        labelKey: "doc.approval",
        becauseKey: "doc.because.coordination",
        level: "coordination",
        handover: true,
      })
    }
  }

  return out
}

/**
 * Whether the user's attachments satisfy a requirement.
 * Attachments are keyed by slot; the set is passed in so this stays pure and
 * testable (the UI reads IndexedDB once and derives every row from it).
 */
export function documentStatus(need: DocumentRequirement, attachedSlots: ReadonlySet<string>): DocumentStatus {
  if (need.handover || !need.slots) return "handover"
  const present = need.slots.ids.filter((slot) => attachedSlots.has(slot))
  if (!present.length) return "missing"
  if (need.slots.match === "any") return "attached"
  return present.length === need.slots.ids.length ? "attached" : "partial"
}

/** Counts for the summary card / section header. */
export function documentsSummary(needs: DocumentRequirement[], attachedSlots: ReadonlySet<string>) {
  const uploadable = needs.filter((need) => need.slots && !need.handover)
  const attached = uploadable.filter((need) => documentStatus(need, attachedSlots) === "attached").length
  return {
    /** Every requirement, including ones the app cannot carry. */
    needed: needs.length,
    /** Requirements that can be satisfied by an upload. */
    uploadable: uploadable.length,
    attached,
    missing: uploadable.length - attached,
  }
}
