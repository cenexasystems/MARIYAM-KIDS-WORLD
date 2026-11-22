import JsBarcode from 'jsbarcode'

/** Normalize any scanned or user-entered barcode to a consistent UPPERCASE trimmed string. */
export const normalizeBarcode = (code: string | null | undefined): string => {
  return (code ?? '').trim().toUpperCase()
}

export interface LabelSizeConfig {
  id: string
  name: string
  labelsPerRow: number
  widthMm: number
  heightMm: number
  horizontalGapMm: number
  isCustom?: boolean
}

export const DEFAULT_LABEL_SIZES: LabelSizeConfig[] = [
  { id: '1_35x22', name: '35 × 22 mm (Compact Tag)', labelsPerRow: 1, widthMm: 35, heightMm: 22, horizontalGapMm: 0 },
  { id: '2_38x25', name: '38 × 25 mm (Tag / Jewelry)', labelsPerRow: 1, widthMm: 38, heightMm: 25, horizontalGapMm: 0 },
  { id: '1_50x25', name: '50 × 25 mm (Standard Compact)', labelsPerRow: 1, widthMm: 50, heightMm: 25, horizontalGapMm: 0 },
  { id: '2_50x25', name: '50 × 38 mm (Retail Standard)', labelsPerRow: 1, widthMm: 50, heightMm: 38, horizontalGapMm: 0 },
  { id: '1_60x40', name: '60 × 40 mm (Shipping / Product)', labelsPerRow: 1, widthMm: 60, heightMm: 40, horizontalGapMm: 0 },
  { id: '1_100x50', name: '100 × 50 mm (Large Carton / Box)', labelsPerRow: 1, widthMm: 100, heightMm: 50, horizontalGapMm: 0 },
  { id: '2up_35x22', name: '35 × 22 mm × 2-Up (Roll, side-by-side)', labelsPerRow: 2, widthMm: 35, heightMm: 22, horizontalGapMm: 2 },
  { id: '2up_50x25', name: '50 × 25 mm × 2-Up (Roll, side-by-side)', labelsPerRow: 2, widthMm: 50, heightMm: 25, horizontalGapMm: 2 },
  { id: '3up_35x22', name: '35 × 22 mm × 3-Up (Roll, side-by-side)', labelsPerRow: 3, widthMm: 35, heightMm: 22, horizontalGapMm: 2 },
  { id: 'a4_4_48x25', name: 'A4 Sheet — 4 columns × 48 × 25 mm', labelsPerRow: 4, widthMm: 48, heightMm: 25, horizontalGapMm: 2 },
  { id: 'a4_4_48x30', name: 'A4 Sheet — 4 columns × 48 × 30 mm', labelsPerRow: 4, widthMm: 48, heightMm: 30, horizontalGapMm: 2 },
  { id: 'a4_3_63x38', name: 'A4 Sheet — 3 columns × 63 × 38 mm', labelsPerRow: 3, widthMm: 63, heightMm: 38, horizontalGapMm: 2 },
  { id: 'a4_2_99x34', name: 'A4 Sheet — 2 columns × 99 × 34 mm (Address label)', labelsPerRow: 2, widthMm: 99, heightMm: 34, horizontalGapMm: 2 },
]

export interface BarcodeSettings {
  printerType: 'label' | 'regular'
  selectedSizeId: string
  showSalePrice: boolean
  showCompanyName: boolean
  showItemName: boolean
  showDiscount: boolean
}

export const DEFAULT_BARCODE_SETTINGS: BarcodeSettings = {
  printerType: 'regular',
  selectedSizeId: '2_38x25',
  showSalePrice: true,
  showCompanyName: true,
  showItemName: true,
  showDiscount: false,
}

export interface SheetLayoutCalculation {
  sheetWidthMm: number
  sheetHeightMm: number
  marginTopMm: number
  marginBottomMm: number
  marginLeftMm: number
  marginRightMm: number
  availableWidthMm: number
  availableHeightMm: number
  columns: number
  rowsPerPage: number
  stickersPerSheet: number
  stickerWidthMm: number
  stickerHeightMm: number
  horizontalGapMm: number
  verticalGapMm: number
}

/**
 * Calculates vertical/portrait sticker sheet layout for printing and preview.
 * Fits multiple stickers onto an A4 portrait sheet (210mm × 297mm)
 * with precise column and row pagination.
 */
export function calculateSheetLayout(
  sizeConfig: { widthMm: number; heightMm: number; labelsPerRow?: number; horizontalGapMm?: number }
): SheetLayoutCalculation {
  const sheetWidthMm = 210
  const sheetHeightMm = 297
  const baseMarginHoriz = 6
  const baseMarginVert = 8

  const availableMaxW = sheetWidthMm - baseMarginHoriz * 2 // 198mm
  const availableMaxH = sheetHeightMm - baseMarginVert * 2 // 281mm

  const stickerWidthMm = sizeConfig.widthMm
  const stickerHeightMm = sizeConfig.heightMm
  const horizontalGapMm = typeof sizeConfig.horizontalGapMm === 'number' && sizeConfig.horizontalGapMm >= 0
    ? sizeConfig.horizontalGapMm
    : 2
  const verticalGapMm = 2.5

  // Determine columns across sheet
  let columns = 1
  if (sizeConfig.labelsPerRow && sizeConfig.labelsPerRow > 1) {
    columns = sizeConfig.labelsPerRow
  } else {
    columns = Math.max(1, Math.floor((availableMaxW + horizontalGapMm) / (stickerWidthMm + horizontalGapMm)))
  }

  // Determine rows per sheet
  const rowsPerPage = Math.max(1, Math.floor((availableMaxH + verticalGapMm) / (stickerHeightMm + verticalGapMm)))
  const stickersPerSheet = Math.max(1, columns * rowsPerPage)

  // Calculate content dimensions and center grid on sheet
  const gridWidthMm = columns * stickerWidthMm + (columns - 1) * horizontalGapMm
  const gridHeightMm = rowsPerPage * stickerHeightMm + (rowsPerPage - 1) * verticalGapMm

  const marginLeftMm = Math.max(2, Math.round(((sheetWidthMm - gridWidthMm) / 2) * 10) / 10)
  const marginRightMm = marginLeftMm
  const marginTopMm = Math.max(4, Math.round(((sheetHeightMm - gridHeightMm) / 2) * 10) / 10)
  const marginBottomMm = marginTopMm

  return {
    sheetWidthMm,
    sheetHeightMm,
    marginTopMm,
    marginBottomMm,
    marginLeftMm,
    marginRightMm,
    availableWidthMm: sheetWidthMm - marginLeftMm * 2,
    availableHeightMm: sheetHeightMm - marginTopMm * 2,
    columns,
    rowsPerPage,
    stickersPerSheet,
    stickerWidthMm,
    stickerHeightMm,
    horizontalGapMm,
    verticalGapMm,
  }
}

const SETTINGS_KEY = 'yg_barcode_settings'
const LEGACY_SETTINGS_KEY = 'clad_barcode_settings'
const CUSTOM_SIZES_KEY = 'yg_custom_label_sizes'
const LEGACY_CUSTOM_SIZES_KEY = 'clad_custom_label_sizes'

const branchKey = (key: string, branch?: string) => branch ? `${key}_${branch}` : key

export function getStoredBarcodeSettings(branch?: string): BarcodeSettings {
  try {
    const scopedKey = branchKey(SETTINGS_KEY, branch)
    const raw = localStorage.getItem(scopedKey) || (!branch || branch === 'pos1' ? localStorage.getItem(SETTINGS_KEY) || localStorage.getItem(LEGACY_SETTINGS_KEY) : null)
    if (raw) {
      const stored = JSON.parse(raw)
      return { ...DEFAULT_BARCODE_SETTINGS, ...stored }
    }
  } catch (e) {
    console.error('Failed to parse barcode settings:', e)
  }

  // Return branch-specific defaults if no stored settings
  // Import at top: import { getDefaultBarcodeSettings } from './brand'
  // For now, return DEFAULT_BARCODE_SETTINGS
  return DEFAULT_BARCODE_SETTINGS
}

export function saveStoredBarcodeSettings(settings: BarcodeSettings, branch?: string): void {
  try {
    localStorage.setItem(branchKey(SETTINGS_KEY, branch), JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save barcode settings:', e)
  }
}

export function getStoredCustomSizes(branch?: string): LabelSizeConfig[] {
  try {
    const scopedKey = branchKey(CUSTOM_SIZES_KEY, branch)
    const raw = localStorage.getItem(scopedKey) || (!branch || branch === 'pos1' ? localStorage.getItem(CUSTOM_SIZES_KEY) || localStorage.getItem(LEGACY_CUSTOM_SIZES_KEY) : null)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to parse custom label sizes:', e)
  }
  return []
}

export function saveStoredCustomSize(size: LabelSizeConfig, branch?: string): LabelSizeConfig[] {
  const existing = getStoredCustomSizes(branch).filter((s) => s.id !== size.id)
  const updated = [...existing, { ...size, isCustom: true }]
  try {
    localStorage.setItem(branchKey(CUSTOM_SIZES_KEY, branch), JSON.stringify(updated))
  } catch (e) {
    console.error('Failed to save custom label size:', e)
  }
  return updated
}

export function getAllLabelSizes(branch?: string): LabelSizeConfig[] {
  return [...DEFAULT_LABEL_SIZES, ...getStoredCustomSizes(branch)]
}

export interface BarcodeQueueItem {
  id: string
  productId: number
  productName: string
  variantId?: string | null
  variantName?: string
  barcodeValue: string
  price: number
  costPrice?: number
  noOfLabels: number
  header: string
  line1: string
  line2: string
  line3: string
  line4: string
  selected: boolean
}

export interface BarcodeRenderOptions {
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  font?: string
  fontOptions?: string
  textMargin?: number
  margin?: number
  lineColor?: string
  background?: string
  /**
   * Physical (print-accurate) sizing in millimetres. When set, width/height/fontSize
   * above are ignored: the bar width is a whole number of printer dots (0.254mm = 2 dots
   * @203dpi / 3 dots @300dpi), a 10-module quiet zone is added on both sides, and the
   * SVG is given explicit mm dimensions so it is never rescaled by CSS.
   */
  physical?: {
    availableWidthMm: number
    barHeightMm: number
    fontMm: number
    moduleMm?: number
    quietModules?: number
  }
}

/** Print-accurate barcode sizing for a label of the given size (mm). */
export function getPhysicalBarcodeOptions(widthMm: number, heightMm: number): BarcodeRenderOptions {
  const innerPaddingMm = heightMm <= 25 ? 1.2 : 1.6
  return {
    displayValue: true,
    font: 'Arial, sans-serif',
    physical: {
      availableWidthMm: Math.max(10, widthMm - innerPaddingMm * 2 - 0.4),
      barHeightMm: Math.max(6, Math.round(heightMm * 0.3 * 10) / 10),
      fontMm: Math.max(2.2, Math.min(3, Math.round(heightMm * 0.075 * 10) / 10)),
    },
  }
}

/**
 * Render a CODE128 barcode directly into an SVG element.
 */
export function renderBarcodeSvg(
  svgElement: SVGSVGElement,
  value: string,
  options?: BarcodeRenderOptions
) {
  if (!svgElement || !value) return

  try {
    if (options?.physical) {
      const p = options.physical
      const quiet = p.quietModules ?? 10
      const preferredModuleMm = p.moduleMm ?? 0.254
      // Pass 1: measure the symbol width in modules (bar width = 1 unit)
      JsBarcode(svgElement, value.trim(), {
        format: 'CODE128', width: 1, height: 10, displayValue: false,
        marginLeft: quiet, marginRight: quiet, marginTop: 0, marginBottom: 0,
      })
      const totalModules = parseFloat(svgElement.getAttribute('viewBox')?.split(' ')[2] || '0') || 1
      // Keep the ideal module width if it fits; otherwise shrink to fit the label
      const moduleMm = Math.min(preferredModuleMm, p.availableWidthMm / totalModules)
      // Pass 2: real render, with height/font expressed in module units
      JsBarcode(svgElement, value.trim(), {
        format: 'CODE128',
        width: 1,
        height: p.barHeightMm / moduleMm,
        displayValue: options.displayValue ?? true,
        fontOptions: 'bold',
        fontSize: p.fontMm / moduleMm,
        font: options.font ?? 'Arial, sans-serif',
        textMargin: 0.5 / moduleMm,
        marginLeft: quiet, marginRight: quiet, marginTop: 0, marginBottom: 0,
        lineColor: options.lineColor ?? '#000000',
        background: options.background ?? '#ffffff',
      })
      const vb = (svgElement.getAttribute('viewBox') || '0 0 1 1').split(' ').map(Number)
      svgElement.setAttribute('width', `${(vb[2] * moduleMm).toFixed(3)}mm`)
      svgElement.setAttribute('height', `${(vb[3] * moduleMm).toFixed(3)}mm`)
      svgElement.setAttribute('shape-rendering', 'crispEdges')
      svgElement.style.shapeRendering = 'crispEdges'
      svgElement.querySelectorAll('rect').forEach((rect) => {
        const isBackground = rect.parentNode === svgElement
        const fill = isBackground ? options.background ?? '#ffffff' : '#000000'
        rect.setAttribute('fill', fill)
        rect.style.fill = fill
        rect.setAttribute('shape-rendering', 'crispEdges')
      })
      svgElement.querySelectorAll('text').forEach((text) => {
        text.setAttribute('fill', '#000000')
        text.setAttribute('font-weight', 'bold')
      })
      return
    }

    JsBarcode(svgElement, value.trim(), {
      format: 'CODE128',
      width: options?.width ?? 2,
      height: options?.height ?? 38,
      displayValue: options?.displayValue ?? true,
      fontOptions: options?.fontOptions ?? 'bold',
      fontSize: options?.fontSize ?? 11,
      font: options?.font ?? 'Arial, sans-serif',
      textMargin: options?.textMargin ?? 1,
      margin: options?.margin ?? 0,
      lineColor: options?.lineColor ?? '#000000',
      background: options?.background ?? '#ffffff',
    })

    // Force crisp, razor-sharp deep black rendering without anti-aliasing fuzziness
    svgElement.setAttribute('shape-rendering', 'crispEdges')
    svgElement.style.shapeRendering = 'crispEdges'

    // JsBarcode draws a full-size background <rect> (direct child of <svg>) behind the bars.
    // Only the bars (rects inside <g>) may be black; the background must stay light.
    const bg = options?.background ?? '#ffffff'
    svgElement.querySelectorAll('rect').forEach((rect) => {
      const isBackground = rect.parentNode === svgElement
      if (isBackground) {
        rect.style.fill = bg
        rect.setAttribute('fill', bg)
      } else {
        rect.setAttribute('fill', '#000000')
        rect.style.fill = '#000000'
      }
      rect.setAttribute('shape-rendering', 'crispEdges')
      rect.style.shapeRendering = 'crispEdges'
    })

    const texts = svgElement.querySelectorAll('text')
    texts.forEach((text) => {
      text.setAttribute('fill', '#000000')
      text.setAttribute('font-weight', 'bold')
      text.style.fontWeight = 'bold'
    })
  } catch (err) {
    console.error('[renderBarcodeSvg] Failed to generate barcode:', err)
  }
}

/**
 * Generate a standalone SVG string for a CODE128 barcode.
 * Executes synchronously in the browser without requiring external CDN scripts.
 */
export function generateBarcodeSvgString(
  value: string,
  options?: BarcodeRenderOptions
): string {
  if (typeof document === 'undefined' || !value) return ''
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    renderBarcodeSvg(svg, value, options)
    return svg.outerHTML || new XMLSerializer().serializeToString(svg)
  } catch (err) {
    console.error('[generateBarcodeSvgString] Failed to generate barcode SVG string:', err)
    return ''
  }
}

/**
 * Format barcode for UI display.
 */
export function formatBarcodeDisplay(value?: string | null): string {
  if (!value) return '—'
  return String(value).trim()
}

/**
 * Validate barcode format (alphanumeric, 4 to 32 chars).
 */
export function isValidBarcodeValue(value: string): boolean {
  return /^[A-Z0-9_-]{4,32}$/i.test(value.trim())
}
