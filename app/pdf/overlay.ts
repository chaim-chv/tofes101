/**
 * Overlay renderer: official flat PDF + user answers → filled PDF bytes.
 *
 * Pipeline: `fields.ts` decides *what* to print, `anchors.json` decides *where*,
 * this file does the drawing. It is browser-safe and lazy-loadable:
 *  - no top-level side effects, no DOM APIs, no network except `fetchImpl`;
 *  - pdf-lib and fontkit are imported inside `renderPdf`, so the first paint
 *    never pays for them;
 *  - callers pass the same-origin asset URLs (`useAppPath().asset(...)`), or the
 *    bytes directly (tests in Bun).
 */
import type { FormState, Signature } from "../form/types"
import type { PDFFont, PDFPage } from "pdf-lib"
import { ANCHORS, SIGNATURE_BOX, isTextAnchor, type Anchor } from "./anchors"
import { buildItems } from "./fields"
import { drawRtl, measureRtl } from "./rtl"

const DEFAULT_PDF_URL = "/assets/tofes-101-official.pdf"
const DEFAULT_FONT_URL = "/fonts/Heebo-Variable.ttf"

/** Same ink the spike validated against Chrome. */
const INK: readonly [number, number, number] = [0.05, 0.12, 0.55]
/** Never shrink below this: smaller is unreadable in print. */
const MIN_FONT_SIZE = 5.5

export type RenderPdfOptions = {
  /** Pre-loaded official PDF (Uint8Array/ArrayBuffer). Skips the fetch. */
  pdf?: Uint8Array | ArrayBuffer
  /** Pre-loaded TTF (Uint8Array/ArrayBuffer). Skips the fetch. */
  font?: Uint8Array | ArrayBuffer
  /** Same-origin URL for the official PDF. */
  pdfUrl?: string
  /** Same-origin URL for the Hebrew TTF. */
  fontUrl?: string
  /** Injectable for tests; defaults to globalThis.fetch. */
  fetchImpl?: typeof fetch
}

function toBytes(value: Uint8Array | ArrayBuffer): Uint8Array {
  return value instanceof Uint8Array ? value : new Uint8Array(value)
}

async function loadBytes(
  provided: Uint8Array | ArrayBuffer | undefined,
  url: string,
  fetchImpl: typeof fetch | undefined,
  label: string,
): Promise<Uint8Array> {
  if (provided) return toBytes(provided)
  if (typeof fetchImpl !== "function") {
    throw new Error(`${label}: no bytes provided and no fetch implementation available`)
  }
  const response = await fetchImpl(url)
  if (!response.ok) throw new Error(`${label}: fetch ${url} failed with ${response.status}`)
  return new Uint8Array(await response.arrayBuffer())
}

/** Shrink to the slot width, then ellipsize if the minimum size is still too wide. */
function fitText(font: PDFFont, text: string, size: number, maxWidth?: number) {
  if (!maxWidth) return { text, size }
  const width = measureRtl(font, text, size)
  if (width <= maxWidth) return { text, size }

  const scaled = Math.max(MIN_FONT_SIZE, (size * maxWidth) / width)
  let next = text
  while (next.length > 1 && measureRtl(font, `${next}…`, scaled) > maxWidth) {
    next = next.slice(0, -1)
  }
  return { text: `${next}…`, size: scaled }
}

function drawText(page: PDFPage, font: PDFFont, anchor: Extract<Anchor, { xRight: number }>, value: string, ink: unknown) {
  const fitted = fitText(font, value, anchor.size ?? 9, anchor.maxWidth)
  drawRtl(page, font, fitted.text, {
    xRight: anchor.xRight,
    // anchors are measured from the top; pdf-lib's origin is bottom-left
    y: page.getHeight() - anchor.yTop,
    size: fitted.size,
    color: ink,
  })
}

function drawMark(page: PDFPage, font: PDFFont, anchor: Extract<Anchor, { mark: true }>, ink: unknown) {
  const size = anchor.size ?? 8
  const width = font.widthOfTextAtSize("X", size)
  page.drawText("X", {
    x: anchor.x - width / 2,
    // +2.6 pt was the visual centre of the printed `o`; put the X baseline
    // slightly below the centre so the two strokes sit inside the box.
    y: page.getHeight() - anchor.y - size * 0.35,
    size,
    font,
    color: ink,
  })
}

function drawSignature(page: PDFPage, signature: Signature, ink: unknown, font: PDFFont) {
  if (signature.kind === "typed" && signature.typedName) {
    drawRtl(page, font, signature.typedName, {
      xRight: SIGNATURE_BOX.x + SIGNATURE_BOX.width,
      y: page.getHeight() - (SIGNATURE_BOX.yTop + SIGNATURE_BOX.height - 2),
      size: 11,
      color: ink,
    })
    return
  }

  if (signature.kind !== "drawn" || !signature.strokes?.length) return
  const box = SIGNATURE_BOX
  for (const stroke of signature.strokes) {
    for (let i = 1; i < stroke.length; i++) {
      const [x1, y1] = stroke[i - 1]
      const [x2, y2] = stroke[i]
      page.drawLine({
        start: { x: box.x + x1 * box.width, y: page.getHeight() - (box.yTop + y1 * box.height) },
        end: { x: box.x + x2 * box.width, y: page.getHeight() - (box.yTop + y2 * box.height) },
        thickness: 1.2,
        color: ink,
      })
    }
  }
}

/**
 * Render a filled copy of the official form.
 * Returns bytes only; the caller decides how to download/share them.
 */
export async function renderPdf(state: FormState, options: RenderPdfOptions = {}): Promise<Uint8Array> {
  const [{ PDFDocument, rgb }, fontkitModule] = await Promise.all([import("pdf-lib"), import("@pdf-lib/fontkit")])
  const fontkit = (fontkitModule as { default?: unknown }).default ?? fontkitModule
  const fetchImpl = options.fetchImpl ?? globalThis.fetch

  const [pdfBytes, fontBytes] = await Promise.all([
    loadBytes(options.pdf, options.pdfUrl ?? DEFAULT_PDF_URL, fetchImpl, "PDF"),
    loadBytes(options.font, options.fontUrl ?? DEFAULT_FONT_URL, fetchImpl, "Font"),
  ])

  const doc = await PDFDocument.load(pdfBytes)
  doc.registerFontkit(fontkit as Parameters<typeof doc.registerFontkit>[0])
  const font = await doc.embedFont(fontBytes, { subset: true })
  const pages = doc.getPages()
  const ink = rgb(INK[0], INK[1], INK[2])

  for (const item of buildItems(state)) {
    const anchor = ANCHORS[item.anchor]
    if (!anchor) throw new Error(`Unknown PDF anchor: ${item.anchor}`)
    const page = pages[anchor.page - 1]
    if (!page) throw new Error(`Anchor ${item.anchor} points to missing page ${anchor.page}`)

    if ("mark" in item) {
      if (!("mark" in anchor)) throw new Error(`Anchor ${item.anchor} is not a mark anchor`)
      drawMark(page, font, anchor, ink)
    } else if ("signature" in item) {
      drawSignature(page, item.signature, ink, font)
    } else if (isTextAnchor(anchor)) {
      drawText(page, font, anchor, item.text, ink)
    } else {
      throw new Error(`Anchor ${item.anchor} cannot hold text`)
    }
  }

  return doc.save()
}
