# law-101-a1 — LOG

Scope: legal/domain KB for Israeli ITC form 101 (טופס 101), tax years 2025–2026.
Workspace: /Users/chv/develop/tofes101

## 2026-10-29 — session start
- Read kb/CONVENTIONS.md; existing KB has flow/field/ux/competitor work by other agents.
- Downloaded and text-extracted:
  - `research/raw/law/official-101.pdf` (identical to tofes101.co.il asset; sha256 bf4f11b0…).
  - `research/raw/law/govil-electronic-101-rules-2026.pdf` — Tax Authority circular 12.1.2026, 23 pp, includes נספח א (per-field required/optional matrix).
  - `research/raw/law/govil-monthly-deductions-2025.pdf` and `...-2026.pdf` — official monthly withholding booklets.
  - `research/raw/law/govil-tofes101-2024.pdf`, `govil-tofes116-2024.pdf`.
  - `research/raw/law/nevo-pkuda-84255.html` — consolidated Income Tax Ordinance.
  - `research/raw/law/nevo-nihul-pinkasot.html` — bookkeeping rules (retention).
  - Kolzchut topic pages (kc-01…kc-23) on credit points.

## Key findings (verified this session)
- Regulation 2(a): employee must fill 101 within 7 days of starting OR first salary, whichever earlier; again on Jan 1 each year; changes within 7 days (reg 2(d)). Employer must demand it (reg 2(c)).
- Regulation 2(a) excludes daily workers and foreign workers from the employee duty.
- Regulation 5(a): no 101 / no other-income section ⇒ maximum withholding (47% top rate).
- 2026 credit point = 2,904 ₪/yr = 242 ₪/mo, frozen 2024–2027 (s33א + 2026 booklet).
- 2025 brackets: 10/14/20/31/35/47, thresholds 84,120 / 120,720 / 193,800 / 269,280 / 560,280.
- 2026 brackets changed retroactively by law of 31.3.2026: 20% to 228,000; 31% to 301,200; then 35% to 560,280.
- Sur-tax 3% above 721,560 (unchanged); +2% on capital income from 2025.
- Resident 2.25 points = 2 (s34) + 0.25 travel (s36); woman +0.5 (s36א) ⇒ 2.75.
- Child schedule 2024–2026: birth 2.5; 1–2 4.5; 3 3.5; 4–5 2.5; 6–17 mother 2 / father 1; 18 mother 0.5 / father 0.
- Single-parent extra +1; alimony-to-ex-spouse +1 (s40א); youth 16–18 +1 (s40ב); academic 1 (BA, ≤3 yrs) / 0.5 (MA, ≤2 yrs); profession 1 (≤3 yrs); soldier 1/6 or 1/12 per month ×36; reserve 2026–27 tiers 0.5/0.75/1 max 4.
- Oleh 2022+: 1 pt (months 1–12), 3 pts/mo (13–30), 2 pts/mo (31–42), 1 pt/mo (43–54). Pre-2022: 42 months at 3/2/1.
- New 2026 temporary law: income exemption for olim/returning residents arriving 5.11.2025–31.12.2026; 600k ceiling in 2026, 1m in 2027–28.
- Spouse-without-income credit: 1 point, only if employee/spouse at retirement age or disabled/blind; spouse income ≤ 25,410 ₪/yr (2026).
- Disability/blind exemption ceilings 2025–26: 684,000 (with stipend) / 445,200 (work) / 81,960 (non-work).
- Retention: bookkeeping rules s25(ג): 7 years from end of tax year OR 6 years from filing, later. Digital 101 archive must keep all versions.
- Privacy Amendment 13 in force 14.8.2025.
- CORRECTION: tax coordination uses **form 116**, not 119. Form 119 is the academic-degree/profession credit declaration. Existing `field/101-tax-coordination.md` says 119 — needs fix.
- The 2026 electronic-101 circular requires the employer to use Tax-Authority-approved software and employer e-signature; a browser form-filler is not an approved electronic-101 system.

## To verify / gaps
- Exact employee penalty for late/non-filing: no explicit fine found; consequence is max withholding + false-declaration offence.
- Employer sanction for failing to demand 101: not found in regulations.
- Full official parents table (gov.il page partly blocked by network filter); child amounts cross-checked against ordinance s40/s66.
- Whether minors need guardian signature (no requirement found).
