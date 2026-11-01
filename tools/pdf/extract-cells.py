"""
Diagnostic: extract the printed cell-grid geometry from the official PDF.

    python3 tools/pdf/extract-cells.py

The form draws its "write one digit/letter per cell" guides as very short
vertical strokes (see the `'` marks in the official PDF). This script walks the
page content streams, tracks the `q ... cm ... Q` translation offset, and prints
every short vertical stroke plus the long rules that bound them, grouped by row.

Output is PDF points from the top-left (same convention as anchors.json).
"""
import re
import sys
from collections import defaultdict
from pypdf import PdfReader

PDF = "public/assets/tofes-101-official.pdf"
num = r"[-+]?\d*\.?\d+"


def segments_for_page(content: str):
    """Yield ((x1, y1), (x2, y2)) in PDF bottom-left space."""
    out = []
    # q ... cm ... Q groups: paths are relative to the cm translation.
    pos = 0
    origin_stack = [(0.0, 0.0)]
    origin = (0.0, 0.0)
    token_re = re.compile(rf"q\s+1 0 0 1 ({num}) ({num}) cm|Q|((?:{num}\s+){{1,6}}(?:m|l|c|re|v|y|h)\b)")
    cursor = None
    start = None
    for m in token_re.finditer(content):
        if m.group(1) is not None:
            ox, oy = float(m.group(1)), float(m.group(2))
            origin_stack.append(origin)
            origin = (origin[0] + ox, origin[1] + oy)
            continue
        if m.group(0) == "Q":
            origin = origin_stack.pop() if len(origin_stack) > 1 else (0.0, 0.0)
            cursor = None
            start = None
            continue
        parts = m.group(3).split()
        op = parts[-1]
        vals = [float(v) for v in parts[:-1]]
        if op == "m":
            cursor = (vals[0] + origin[0], vals[1] + origin[1])
            start = cursor
        elif op in ("l",):
            nxt = (vals[0] + origin[0], vals[1] + origin[1])
            if cursor:
                out.append((cursor, nxt))
            cursor = nxt
        elif op == "re":
            x, y, w, h = vals
            p1 = (x + origin[0], y + origin[1])
            out.append((p1, (p1[0] + w, p1[1])))
            out.append(((p1[0] + w, p1[1]), (p1[0] + w, p1[1] + h)))
            out.append(((p1[0] + w, p1[1] + h), (p1[0], p1[1] + h)))
            out.append(((p1[0], p1[1] + h), p1))
            cursor = None
        elif op in ("c", "v", "y"):
            if op == "c":
                nxt = (vals[4] + origin[0], vals[5] + origin[1])
            else:
                nxt = (vals[2] + origin[0], vals[3] + origin[1])
            if cursor:
                out.append((cursor, nxt))
            cursor = nxt
        elif op == "h":
            if cursor and start:
                out.append((cursor, start))
            cursor = start
    return out


reader = PdfReader(PDF)
for page_no, page in enumerate(reader.pages, start=1):
    H = float(page.mediabox.height)
    segs = segments_for_page(page.get_contents().get_data().decode("latin-1"))

    ticks = []
    rules = []
    for (x1, y1), (x2, y2) in segs:
        # flip to top-left
        t1, t2 = H - y1, H - y2
        if abs(x1 - x2) < 0.1:  # vertical
            top, bot = min(t1, t2), max(t1, t2)
            length = bot - top
            if 2.5 <= length <= 8:
                ticks.append((round(x1, 2), round(top, 2), round(bot, 2)))
            elif 8 < length <= 40:
                rules.append(("V", round(x1, 2), round(top, 2), round(bot, 2)))
        elif abs(y1 - y2) < 0.1:  # horizontal
            left, right = min(x1, x2), max(x1, x2)
            length = right - left
            if 20 < length <= 250:
                rules.append(("H", round(left, 2), round(right, 2), round(t1, 2)))

    ticks.sort(key=lambda t: (round(t[1] / 3), t[0]))
    print(f"# page {page_no}: {len(ticks)} short vertical strokes")
    # Group ticks into rows by top position (±1.5 pt)
    rows = []
    for t in ticks:
        placed = False
        for row in rows:
            if abs(row["top"] - t[1]) < 1.5:
                row["ticks"].append(t)
                placed = True
                break
        if not placed:
            rows.append({"top": t[1], "ticks": [t]})
    for row in sorted(rows, key=lambda r: r["top"]):
        xs = sorted(t[0] for t in row["ticks"])
        if len(xs) < 2:
            continue
        gaps = [round(b - a, 1) for a, b in zip(xs, xs[1:])]
        print(f"  row top≈{row['top']:.1f}: {len(xs)} ticks x={xs}")
        print(f"    gaps={gaps}  span={xs[0]}..{xs[-1]}")
