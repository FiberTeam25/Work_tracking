import ExcelJS from 'exceljs'

export interface ExcelInvoiceLine {
  code: string
  description_ar: string
  unit: string
  quantity: number
  unit_price: number
  line_total: number
  group_code: string
  group_name_ar: string
}

export interface ExcelInvoiceData {
  invoice_number: string
  period_start: string
  period_end: string
  status: string
  project_name_ar: string
  project_code: string
  site_name_ar: string
  site_code: string
  subtotal: number
  retention_pct: number
  retention_amt: number
  tax_pct: number
  tax_amt: number
  net_payable: number
  created_by: string
  lines: ExcelInvoiceLine[]
}

// Dark-theme palette mapped to Excel ARGB (FF + hex)
const COLORS = {
  bg0:     'FF0A0E14',
  bg1:     'FF111720',
  bg2:     'FF1A2230',
  accent2: 'FF38BDF8',
  ink0:    'FFE2E8F0',
  ink1:    'FF94A3B8',
  ink2:    'FF64748B',
  border:  'FF1E293B',
  success: 'FF22C55E',
  danger:  'FFEF4444',
  white:   'FFFFFFFF',
  groupBg: 'FF0F172A',
}

function cell(ws: ExcelJS.Worksheet, r: number, c: number): ExcelJS.Cell {
  return ws.getCell(r, c)
}

function applyBorder(c: ExcelJS.Cell) {
  const thin: ExcelJS.Border = { style: 'thin', color: { argb: COLORS.border } }
  c.border = { top: thin, left: thin, bottom: thin, right: thin }
}

function headerCell(c: ExcelJS.Cell, value: string) {
  c.value = value
  c.font = { name: 'IBM Plex Sans Arabic', bold: true, color: { argb: COLORS.ink1 }, size: 10 }
  c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bg2 } }
  c.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rightToLeft' }
  applyBorder(c)
}

function dataCell(
  c: ExcelJS.Cell,
  value: string | number,
  opts: {
    bold?: boolean
    color?: string
    fill?: string
    numFmt?: string
    align?: ExcelJS.Alignment['horizontal']
  } = {}
) {
  c.value = value
  c.font = {
    name: 'IBM Plex Sans Arabic',
    bold: opts.bold ?? false,
    color: { argb: opts.color ?? COLORS.ink0 },
    size: 9,
  }
  if (opts.fill) {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: opts.fill } }
  }
  if (opts.numFmt) c.numFmt = opts.numFmt
  c.alignment = { horizontal: opts.align ?? 'right', vertical: 'middle', readingOrder: 'rightToLeft' }
  applyBorder(c)
}

export async function buildInvoiceExcel(data: ExcelInvoiceData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'FieldOps FTTH'
  wb.created = new Date()

  const ws = wb.addWorksheet('مستخلص', {
    views: [{ rightToLeft: true }],
    properties: { defaultRowHeight: 20 },
  })

  ws.pageSetup.orientation = 'landscape'
  ws.pageSetup.fitToPage = true

  // Column widths (RTL: col A is rightmost visually)
  ws.columns = [
    { key: 'code',    width: 12 },  // A — BOQ code
    { key: 'desc',    width: 40 },  // B — description
    { key: 'unit',    width: 10 },  // C — unit
    { key: 'qty',     width: 14 },  // D — quantity
    { key: 'price',   width: 18 },  // E — unit price
    { key: 'total',   width: 20 },  // F — line total
  ]

  let row = 1

  // ── Title block ─────────────────────────────────────────────────────────────
  ws.mergeCells(row, 1, row, 6)
  const titleCell = ws.getCell(row, 1)
  titleCell.value = `مستخلص — ${data.invoice_number}`
  titleCell.font = { name: 'IBM Plex Sans Arabic', bold: true, size: 14, color: { argb: COLORS.accent2 } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bg0 } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', readingOrder: 'rightToLeft' }
  ws.getRow(row).height = 28
  row++

  // Meta rows
  const meta: [string, string][] = [
    ['المشروع', `${data.project_name_ar} (${data.project_code})`],
    ['الموقع', `${data.site_name_ar} (${data.site_code})`],
    ['الفترة', `${data.period_start} — ${data.period_end}`],
    ['الحالة', data.status],
    ['أنشأه', data.created_by],
  ]
  for (const [label, val] of meta) {
    ws.mergeCells(row, 1, row, 3)
    ws.mergeCells(row, 4, row, 6)
    dataCell(ws.getCell(row, 1), label, { bold: true, fill: COLORS.bg1, color: COLORS.ink1 })
    dataCell(ws.getCell(row, 4), val, { fill: COLORS.bg1 })
    row++
  }
  row++ // blank separator

  // ── Column headers ──────────────────────────────────────────────────────────
  const headers = ['الكود', 'الوصف', 'الوحدة', 'الكمية', 'سعر الوحدة (ج.م)', 'الإجمالي (ج.م)']
  headers.forEach((h, i) => headerCell(ws.getCell(row, i + 1), h))
  ws.getRow(row).height = 24
  row++

  // ── Line items grouped by BOQ group ─────────────────────────────────────────
  const byGroup = new Map<string, { name: string; lines: ExcelInvoiceLine[] }>()
  for (const l of data.lines) {
    if (!byGroup.has(l.group_code)) byGroup.set(l.group_code, { name: l.group_name_ar, lines: [] })
    byGroup.get(l.group_code)!.lines.push(l)
  }

  for (const [gCode, { name, lines }] of byGroup) {
    // Group header row
    ws.mergeCells(row, 1, row, 6)
    const gc = ws.getCell(row, 1)
    gc.value = `${gCode} — ${name}`
    gc.font = { name: 'IBM Plex Sans Arabic', bold: true, size: 9, color: { argb: COLORS.ink1 } }
    gc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.groupBg } }
    gc.alignment = { horizontal: 'right', readingOrder: 'rightToLeft' }
    ws.getRow(row).height = 18
    row++

    for (const [idx, l] of lines.entries()) {
      const fill = idx % 2 === 0 ? COLORS.bg0 : COLORS.bg1
      const numFmt = '#,##0.00'
      dataCell(ws.getCell(row, 1), l.code, { fill, color: COLORS.accent2 })
      dataCell(ws.getCell(row, 2), l.description_ar, { fill })
      dataCell(ws.getCell(row, 3), l.unit, { fill, align: 'center' })
      dataCell(ws.getCell(row, 4), l.quantity, { fill, numFmt, align: 'left' })
      dataCell(ws.getCell(row, 5), l.unit_price, { fill, numFmt, align: 'left' })
      dataCell(ws.getCell(row, 6), l.line_total, { fill, numFmt, bold: true, align: 'left' })
      ws.getRow(row).height = 18
      row++
    }
  }

  row++ // blank before totals

  // ── Totals block ─────────────────────────────────────────────────────────────
  const totalsRows: [string, number, string?, string?][] = [
    ['المجموع الفرعي',             data.subtotal,      COLORS.ink0,   COLORS.bg2],
    [`خصم الضمان (${data.retention_pct}%)`, -data.retention_amt, COLORS.danger, COLORS.bg2],
    [`ضريبة القيمة المضافة (${data.tax_pct}%)`,  -data.tax_amt,      COLORS.danger, COLORS.bg2],
    ['صافي المستحق',               data.net_payable,   COLORS.success, COLORS.groupBg],
  ]

  for (const [label, val, color, fill] of totalsRows) {
    ws.mergeCells(row, 1, row, 4)
    dataCell(ws.getCell(row, 1), label, { bold: true, fill: fill!, color: color! })
    ws.mergeCells(row, 5, row, 6)
    dataCell(ws.getCell(row, 5), Math.abs(val), {
      bold: true,
      fill: fill!,
      color: color!,
      numFmt: '#,##0.00" ج.م"',
      align: 'left',
    })
    ws.getRow(row).height = 22
    row++
  }

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
