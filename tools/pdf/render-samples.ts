/**
 * Visual verification harness: render three representative profiles to
 * `research/spikes/pdf/out/` and rasterise them with Ghostscript.
 *
 *   bun run tools/pdf/render-samples.ts
 *
 * This is a developer tool, not shipped code. It uses local assets only.
 */
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { emptyState, setField } from "../../app/form/values"
import type { FormState, Signature } from "../../app/form/types"
import { renderPdf } from "../../app/pdf/overlay"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const OUT = `${ROOT}research/spikes/pdf/out`
const PDF = `${ROOT}public/assets/tofes-101-official.pdf`
const FONT = `${ROOT}public/fonts/Heebo-Variable.ttf`

const pdf = new Uint8Array(readFileSync(PDF))
const font = new Uint8Array(readFileSync(FONT))

function state(apply: (set: (id: string, value: unknown) => void) => void): FormState {
  let current = emptyState(2026)
  const set = (id: string, value: unknown) => {
    current = setField(current, id, value)
  }
  apply(set)
  return current
}

const drawnSignature: Signature = {
  kind: "drawn",
  strokes: [
    [
      [0.08, 0.72],
      [0.2, 0.3],
      [0.34, 0.82],
      [0.48, 0.25],
      [0.62, 0.7],
      [0.78, 0.35],
      [0.94, 0.62],
    ],
  ],
  signedAt: "2026-02-01T10:00:00.000Z",
  declarationVersion: "2026-he-1",
}

const typedSignature: Signature = {
  kind: "typed",
  typedName: "דוד לוי",
  signedAt: "2026-02-01T10:00:00.000Z",
  declarationVersion: "2026-he-1",
}

/* --------------------------------------------------------------- profiles */

const single = state((set) => {
  set("employer.name", 'חברת אלפא טכנולוגיות בע"מ')
  set("employer.address", "דרך מנחם בגין 121, תל אביב")
  set("employer.phone", "03-6543210")
  set("employer.deductionFile", "931234567")

  set("employee.idKind", "idNum")
  set("employee.idNum", "012345678")
  set("employee.firstName", "דוד")
  set("employee.lastName", "לוי")
  set("employee.birthDate", "1992-07-18")
  set("employee.aliyahDate", "")
  set("employee.city", "רמת גן")
  set("employee.street", "ביאליק")
  set("employee.houseNum", "45")
  set("employee.zip", "5245101")
  set("employee.mobile", "052-9876543")
  set("employee.email", "david.levi@example.com")

  set("employee.sex", "male")
  set("employee.maritalStatus", "single")
  set("employee.ilResident", true)
  set("employee.kibbutzMember", false)
  set("employee.healthFundMember", true)
  set("employee.healthFundName", "מכבי")

  set("children", [])
  set("income.salaryTypes", ["monthly"])
  set("income.startDate", "2026-01-01")
  set("other.hasOther", false)
  set("credits.resident", true)
  set("credits.reserve", false)
  set("coord.request", false)
  set("sign.date", "2026-02-01")
  set("sign.signature", typedSignature)
})

const family = state((set) => {
  set("employer.name", 'מפעלי הצפון בע"מ')
  set("employer.address", "החרושת 3, קריית ביאליק")
  set("employer.phone", "04-8765432")
  set("employer.deductionFile", "912345678")

  set("employee.idKind", "idNum")
  set("employee.idNum", "234567890")
  set("employee.firstName", "רונית")
  set("employee.lastName", "כהן")
  set("employee.birthDate", "1986-03-09")
  set("employee.city", "חיפה")
  set("employee.street", "שדרות הנשיא")
  set("employee.houseNum", "88")
  set("employee.zip", "3456789")
  set("employee.mobile", "054-7654321")
  set("employee.email", "ronit.cohen@example.com")

  set("employee.sex", "female")
  set("employee.maritalStatus", "married")
  set("employee.ilResident", true)
  set("employee.kibbutzMember", false)
  set("employee.healthFundMember", true)
  set("employee.healthFundName", "כללית")

  set("spouse.firstName", "אבי")
  set("spouse.lastName", "כהן")
  set("spouse.idNum", "345678901")
  set("spouse.birthDate", "1984-12-01")
  set("spouse.hasIncome", "no")
  set("spouse.noIncomeDeclaration", true)

  set("children", [
    {
      _key: "c1",
      "name": "נועה כהן",
      "idNum": "312345678",
      "birthDate": "2014-05-14",
      "custody": true,
      "allowance": true,
    },
    {
      _key: "c2",
      "name": "איתי כהן",
      "idNum": "323456789",
      "birthDate": "2018-09-02",
      "custody": true,
      "allowance": true,
    },
  ])

  set("income.salaryTypes", ["monthly"])
  set("income.startDate", "2026-01-01")
  set("other.hasOther", false)
  set("credits.resident", true)
  set("credits.childrenCustody", true)
  set("credits.incomelessSpouse", true)
  set("coord.request", false)
  set("sign.date", "2026-02-03")
  set("sign.signature", drawnSignature)
})

const immigrant = state((set) => {  set("employer.name", 'גליל תעשיות בע"מ')
  set("employer.address", "המלאכה 7, נהריה")
  set("employer.phone", "04-5551234")
  set("employer.deductionFile", "987654321")

  set("employee.idKind", "idNum")
  set("employee.idNum", "456789012")
  set("employee.firstName", "יוליה")
  set("employee.lastName", "רוזן")
  set("employee.birthDate", "1990-11-27")
  set("employee.aliyahDate", "2025-03-15")
  set("employee.city", "נהריה")
  set("employee.street", "הגעתון")
  set("employee.houseNum", "19")
  set("employee.zip", "2240001")
  set("employee.mobile", "053-1112233")
  set("employee.email", "yulia.rozen@example.com")

  set("employee.sex", "female")
  set("employee.maritalStatus", "single")
  set("employee.ilResident", true)
  set("employee.kibbutzMember", false)
  set("employee.healthFundMember", true)
  set("employee.healthFundName", "מאוחדת")

  set("children", [
    {
      _key: "c1",
      "name": "דניאל רוזן",
      "idNum": "334455667",
      "birthDate": "2016-08-21",
      "custody": true,
      "allowance": false,
    },
  ])

  set("income.salaryTypes", ["monthly", "additional"])
  set("income.startDate", "2026-02-01")
  set("other.hasOther", true)
  set("other.types", ["allowance"])
  set("other.creditsElsewhere", "no")
  set("other.studyFund", true)
  set("other.pension", false)

  set("credits.resident", true)
  set("credits.locality", true)
  set("credits.localityName", "נהריה")
  set("credits.localityFrom", "2025-03-15")
  set("credits.immigrant", true)
  set("credits.immigrantType", "immigrant")
  set("credits.immigrantFrom", "2025-03-15")
  set("credits.immigrantNoIncomeUntil", "2025-06-30")
  set("credits.childrenCustody", true)
  set("credits.reserve", true)
  set("credits.reserveDays", "18")

  set("coord.request", true)
  set("coord.reason", "other-incomes")
  set("coord.employers", [
    {
      _key: "e1",
      "name": "סטודיו אור בע\"מ",
      "address": "הרצל 4, עכו",
      "fileNum": "901234567",
      "incomeType": "work",
      "monthlyIncome": "4,200",
      "monthlyTax": "620",
    },
    {
      _key: "e2",
      "name": "קרן מלגות צפון",
      "address": "שדרות בן גוריון 2, נהריה",
      "fileNum": "902345678",
      "incomeType": "scholarship",
      "monthlyIncome": "1,500",
      "monthlyTax": "0",
    },
  ])

  set("sign.date", "2026-02-05")
  set("sign.signature", drawnSignature)
})

/**
 * Passport holder: no Israeli ID, so the 13-cell passport grid is the identity
 * slot and the page-2 header repeats the passport number.
 */
const passport = state((set) => {
  set("employer.name", 'חברת חוף בע"מ')
  set("employer.address", "הנמל 2, חיפה")
  set("employer.phone", "04-1112233")
  set("employer.deductionFile", "955443322")

  set("employee.idKind", "passport")
  set("employee.passportCountry", 'ארה"ב')
  set("employee.passportNum", "AB1234567")
  set("employee.firstName", "ג'ון")
  set("employee.lastName", "סמית'")
  set("employee.birthDate", "1990-01-01")
  set("employee.city", "תל אביב")
  set("employee.street", "דיזנגוף")
  set("employee.houseNum", "1")
  set("employee.zip", "6120101")
  set("employee.mobile", "050-1234567")
  set("employee.email", "john@example.com")

  set("employee.sex", "male")
  set("employee.maritalStatus", "single")
  set("employee.ilResident", true)
  set("employee.kibbutzMember", false)
  set("employee.healthFundMember", true)
  set("employee.healthFundName", "כללית")

  set("income.salaryTypes", ["monthly"])
  set("income.startDate", "2026-01-01")
  set("other.hasOther", false)
  set("credits.resident", true)
  set("coord.request", false)
  set("sign.date", "2026-02-01")
  set("sign.signature", typedSignature)
})

/* ------------------------------------------------------------------ render */

const profiles: Array<[string, FormState]> = [
  ["single", single],
  ["family", family],
  ["immigrant", immigrant],
  ["passport", passport],
]

mkdirSync(OUT, { recursive: true })
for (const [name, profile] of profiles) {
  const bytes = await renderPdf(profile, { pdf, font })
  const file = `${OUT}/sample-${name}.pdf`
  writeFileSync(file, bytes)
  console.log(`${name}: ${(bytes.byteLength / 1024).toFixed(1)} KB -> ${file}`)
  execFileSync("gs", [
    "-q",
    "-dNOPAUSE",
    "-dBATCH",
    "-sDEVICE=png16m",
    "-r150",
    `-sOutputFile=${OUT}/sample-${name}-p%d.png`,
    file,
  ])
}
console.log(`PNGs written under ${OUT}`)
