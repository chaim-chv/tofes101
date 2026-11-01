"""
Visual audit: overlay the *extracted* cell grids (green) and the *current*
anchors.json text anchors (red) on the official blank PDF.

    python3 tools/pdf/audit-slots.py

Output: research/pdf-slots/page1-audit.png, page2-audit.png
Requires Ghostscript (`gs`) and Pillow; both already used by the repo's spikes.
"""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PDF = ROOT / "public/assets/tofes-101-official.pdf"
OUT = ROOT / "research/pdf-slots"
OUT.mkdir(parents=True, exist_ok=True)
SCALE = 200 / 72  # 200 dpi

# ---------------------------------------------------------------- extracted grids
# (x0, x1, baseline/top, cells, label) — all PDF points from the top-left.
GRIDS = {
    1: [
        (220.41, 285.31, 97.6, 4, "taxYear"),
        (39.89, 130.29, 180.3, 8, "employer.deductionFile (+ printed 9)"),
        (28.69, 119.01, 231.0, 8, "employee.aliyahDate"),
        (119.01, 210.00, 231.0, 8, "employee.birthDate"),
        (438.11, 540.21, 231.0, 9, "employee.idNum"),
        (29.23, 108.44, 254.0, 7, "employee.zip"),
        (392.50, 540.21, 259.3, 13, "employee.passportNum"),
        (30.75, 121.39, 387.0, 8, "income.startDate"),
        (258.01, 346.91, 396.2, 8, "children[*].birthDate"),
        (346.91, 448.81, 396.2, 9, "children[*].idNum"),
        (31.87, 119.33, 706.0, 8, "spouse.aliyahDate (unfilled)"),
        (119.33, 209.97, 706.0, 8, "spouse.birthDate"),
        (437.76, 539.23, 706.0, 9, "spouse.idNum"),
        (421.65, 538.98, 731.9, 13, "spouse.passportNum (unfilled)"),
    ],
    2: [
        (95.66, 170.66, 27.5, 1, "header employee ID (no anchor)"),
    ],
}

# page 2 coordination table columns (right edges) and pre-printed 9s
COORD_COLS = [
    (444.34, 538.63, "name"),
    (309.84, 444.34, "address"),
    (231.34, 309.84, "fileNum (printed 9 at x=235.75)"),
    (173.04, 231.34, "incomeType"),
    (100.44, 173.04, "monthlyIncome"),
    (28.41, 100.44, "monthlyTax"),
]

# page 2 prose blanks that matter
P2_BLANKS = [
    (254.07, 331.62, 106.54, "credits.localityFrom"),
    (294.32, 440.32, 119.88, "credits.localityName"),
    (284.11, 318.64, 131.80, "credits.immigrantFrom"),
    (190.97, 250.57, 147.89, "credits.immigrantNoIncomeUntil"),
    (192.65, 249.86, 423.25, "credits.serviceStart"),
    (58.82, 118.87, 424.25, "credits.serviceEnd"),
    (340.90, 364.00, 460.50, "credits.reserveDays"),
    (447.50, 467.30, 367.50, "credits.disabledChildCount"),
]


def render(page_no: int) -> Image.Image:
    png = OUT / f"blank-p{page_no}.png"
    subprocess.run(
        [
            "gs", "-q", "-dNOPAUSE", "-dBATCH", "-sDEVICE=png16m", "-r200",
            f"-dFirstPage={page_no}", f"-dLastPage={page_no}",
            f"-sOutputFile={png}", str(PDF),
        ],
        check=True,
    )
    return Image.open(png).convert("RGB")


def audit(page_no: int):
    im = render(page_no)
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 11)
    except Exception:
        font = ImageFont.load_default()

    # grids
    for x0, x1, y, cells, label in GRIDS.get(page_no, []):
        step = (x1 - x0) / cells
        d.rectangle([x0 * SCALE, (y - 12) * SCALE, x1 * SCALE, (y + 2) * SCALE], outline=(0, 150, 0), width=1)
        for i in range(cells + 1):
            x = (x0 + i * step) * SCALE
            d.line([x, (y - 10) * SCALE, x, (y + 1) * SCALE], fill=(0, 170, 0), width=1)
        d.text((x0 * SCALE, (y - 24) * SCALE), label, fill=(0, 120, 0), font=font)

    if page_no == 2:
        for x0, x1, label in COORD_COLS:
            d.rectangle([x0 * SCALE, 545 * SCALE, x1 * SCALE, 601 * SCALE], outline=(0, 150, 0), width=1)
        for a, b, y, label in P2_BLANKS:
            d.rectangle([a * SCALE, (y - 10) * SCALE, b * SCALE, (y + 2) * SCALE], outline=(0, 150, 0), width=2)
            d.text((a * SCALE, (y - 22) * SCALE), label, fill=(0, 120, 0), font=font)

    # current anchors
    anchors = json.loads((ROOT / "app/pdf/anchors.json").read_text())["anchors"]
    for key, a in anchors.items():
        if a["page"] != page_no:
            continue
        if "xRight" not in a:
            continue
        x = a["xRight"] * SCALE
        y = a["yTop"] * SCALE
        d.line([x - 6, y - 6, x + 6, y + 6], fill=(200, 0, 0), width=2)
        d.line([x - 6, y + 6, x + 6, y - 6], fill=(200, 0, 0), width=2)
        d.text((x + 4, y - 14), key, fill=(200, 0, 0), font=font)

    out = OUT / f"page{page_no}-audit.png"
    im.save(out)
    print(out)


audit(1)
audit(2)
