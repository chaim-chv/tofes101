# raw/law — source artifacts for the form-101 legal KB

All retrieved 2026-10-29. Text extracts are in `extracted/`.

## Primary artifacts

| File | What it is |
| --- | --- |
| `official-101.pdf` / `tofes-101-tofes101.pdf` | official blank form 0101/130 (11.2025), 2 pages, SHA-256 `bf4f11b0…d7d633` |
| `govil-tofes101-2024.pdf` | Tax Authority’s 2024 form 101 (layout comparison) |
| `govil-tofes116-2024.pdf` | form 116 (tax coordination) |
| `govil-electronic-101-rules-2026.pdf` | circular 12.1.2026, electronic 101 rules + per-field matrix (נספח א) |
| `govil-monthly-deductions-2025.pdf` | official 2025 withholding booklet |
| `govil-monthly-deductions-2026.pdf` | official 2026 withholding booklet (April 2026 update) |
| `nevo-pkuda-84255.html` | consolidated Income Tax Ordinance |
| `nevo-nihul-pinkasot.html` | bookkeeping rules (retention) |
| `wikisource-nikuim-mimaskoret.html` | payroll withholding regulations 1993 |
| `btl-child-disability.pdf` | NII child-disability allowance leaflet |

## Reader captures (gov.il HTML, 403 to curl)

`jina-govil-*.md`, `jina-credit-spouse.md` — content read through `r.jina.ai`.
`govil-*.html` files that remain are successful PDFs or reader pages, not the
Cloudflare block page.

## Kolzchut captures

`kc-01.html` … `kc-23.html` — credit-point topic pages; `extracted/kc-*.txt`.
`kolzchut-tofes101.html` / `.txt` — the form-101 procedure page.

## Notes

- The gov.il parents page was only partially readable from this network; the
  official table is cross-checked against the ordinance ss. 40/66 and Kol Zchut.
- Do not trust the text layer for layout; use `extracted/tofes101-p1.png` and
  `p2.png`.
