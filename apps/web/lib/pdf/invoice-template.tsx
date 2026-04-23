import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// ─── Arabic font registration ──────────────────────────────────────────────────
// We use the Google Fonts CDN. In production swap for a locally bundled .ttf
Font.register({
  family: 'IBMPlexSansArabic',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3MZRtWPQCuHme67tEYUIx3Kh0PHR9N6YPO_ICqYkE6.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3NZRtWPQCuHme67tEYUIx3Kh0PHR9N6YPO_ICqYkE6-sm8.ttf',
      fontWeight: 700,
    },
  ],
})

// ─── Styles ────────────────────────────────────────────────────────────────────
const C = {
  bg0: '#0a0e14',
  bg1: '#111720',
  bg2: '#1a2230',
  accent: '#3b82f6',
  accent2: '#38bdf8',
  ink0: '#e2e8f0',
  ink1: '#94a3b8',
  ink2: '#64748b',
  border: '#1e293b',
  success: '#22c55e',
  danger: '#ef4444',
  white: '#ffffff',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'IBMPlexSansArabic',
    backgroundColor: C.bg0,
    color: C.ink0,
    padding: 32,
    fontSize: 9,
    direction: 'rtl',
  },

  /* Header */
  headerRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 24 },
  logoBox: { flexDirection: 'column', alignItems: 'flex-end' },
  logoTitle: { fontSize: 18, fontWeight: 700, color: C.accent2, letterSpacing: 1 },
  logoSub: { fontSize: 9, color: C.ink1, marginTop: 2 },
  metaBox: { alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', marginBottom: 3 },
  metaLabel: { color: C.ink2, width: 72 },
  metaValue: { color: C.ink0, fontWeight: 700 },
  badge: {
    backgroundColor: C.accent,
    color: C.white,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 8,
    fontWeight: 700,
    alignSelf: 'flex-start',
  },

  /* Section heading */
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.accent2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'right',
  },

  /* Table */
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 4, overflow: 'hidden' },
  thead: { flexDirection: 'row-reverse', backgroundColor: C.bg2 },
  tbody_row: { flexDirection: 'row-reverse', borderTopWidth: 1, borderTopColor: C.border },
  tbody_alt: { backgroundColor: C.bg1 },
  group_row: { flexDirection: 'row-reverse', backgroundColor: C.bg2, paddingVertical: 3 },
  group_label: { flex: 1, color: C.ink1, fontWeight: 700, fontSize: 8, paddingHorizontal: 8, textAlign: 'right' },

  th: { color: C.ink1, fontWeight: 700, fontSize: 8, paddingVertical: 6, paddingHorizontal: 6 },
  td: { color: C.ink0, paddingVertical: 5, paddingHorizontal: 6 },

  col_code:   { width: 44 },
  col_desc:   { flex: 1 },
  col_unit:   { width: 36 },
  col_qty:    { width: 52, textAlign: 'left' },
  col_price:  { width: 68, textAlign: 'left' },
  col_total:  { width: 78, textAlign: 'left' },

  /* Totals */
  totalsBox: {
    marginTop: 16,
    alignSelf: 'flex-end',
    width: 260,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  totalsRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 5, paddingHorizontal: 12 },
  totalsLabel: { color: C.ink1 },
  totalsValue: { color: C.ink0, fontWeight: 700 },
  totalsNet: { backgroundColor: C.bg2 },
  totalsNetLabel: { color: C.accent2, fontWeight: 700, fontSize: 11 },
  totalsNetValue: { color: C.success, fontWeight: 700, fontSize: 11 },
  totalsDeduction: { color: C.danger },

  /* Footer */
  footer: { marginTop: 32, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8,
    flexDirection: 'row-reverse', justifyContent: 'space-between' },
  footerText: { color: C.ink2, fontSize: 7 },
})

// ─── Helper ────────────────────────────────────────────────────────────────────
function fmtEGP(n: number) {
  return new Intl.NumberFormat('ar-EG', { minimumFractionDigits: 2 }).format(n) + ' ج.م'
}
function fmtQty(n: number) {
  return new Intl.NumberFormat('ar-EG', { maximumFractionDigits: 2 }).format(n)
}

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface InvoicePdfLine {
  code: string
  description_ar: string
  unit: string
  unit_price: number
  quantity: number
  line_total: number
  group_code: string
  group_name_ar: string
}

export interface InvoicePdfData {
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
  lines: InvoicePdfLine[]
}

// ─── Document ──────────────────────────────────────────────────────────────────
export function InvoiceDocument({ inv }: { inv: InvoicePdfData }) {
  const byGroup = new Map<string, { name: string; lines: InvoicePdfLine[] }>()
  for (const l of inv.lines) {
    if (!byGroup.has(l.group_code)) byGroup.set(l.group_code, { name: l.group_name_ar, lines: [] })
    byGroup.get(l.group_code)!.lines.push(l)
  }

  return (
    <Document
      title={inv.invoice_number}
      author="FieldOps FTTH"
      language="ar"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.headerRow}>
          <View style={s.logoBox}>
            <Text style={s.logoTitle}>FieldOps FTTH</Text>
            <Text style={s.logoSub}>أفرو جروب × تيليكوم مصر</Text>
          </View>
          <View style={s.metaBox}>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>رقم المستخلص:</Text>
              <Text style={s.metaValue}>{inv.invoice_number}</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>المشروع:</Text>
              <Text style={s.metaValue}>{inv.project_name_ar} ({inv.project_code})</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>الموقع:</Text>
              <Text style={s.metaValue}>{inv.site_name_ar} ({inv.site_code})</Text>
            </View>
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>الفترة:</Text>
              <Text style={s.metaValue}>{inv.period_start} ← {inv.period_end}</Text>
            </View>
            <View style={[s.metaRow, { marginTop: 6 }]}>
              <Text style={s.badge}>{inv.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* ── Line items ── */}
        <Text style={s.sectionTitle}>بنود المستخلص</Text>
        <View style={s.table}>
          {/* thead */}
          <View style={s.thead}>
            <Text style={[s.th, s.col_code]}>الكود</Text>
            <Text style={[s.th, s.col_desc]}>الوصف</Text>
            <Text style={[s.th, s.col_unit]}>الوحدة</Text>
            <Text style={[s.th, s.col_qty]}>الكمية</Text>
            <Text style={[s.th, s.col_price]}>سعر الوحدة (ج.م)</Text>
            <Text style={[s.th, s.col_total]}>الإجمالي (ج.م)</Text>
          </View>

          {Array.from(byGroup.entries()).map(([gCode, { name, lines }]) => (
            <View key={gCode}>
              <View style={s.group_row}>
                <Text style={s.group_label}>{gCode} — {name}</Text>
              </View>
              {lines.map((l, idx) => (
                <View key={l.code} style={[s.tbody_row, idx % 2 === 1 ? s.tbody_alt : {}]}>
                  <Text style={[s.td, s.col_code]}>{l.code}</Text>
                  <Text style={[s.td, s.col_desc]}>{l.description_ar}</Text>
                  <Text style={[s.td, s.col_unit]}>{l.unit}</Text>
                  <Text style={[s.td, s.col_qty]}>{fmtQty(l.quantity)}</Text>
                  <Text style={[s.td, s.col_price]}>{fmtQty(l.unit_price)}</Text>
                  <Text style={[s.td, s.col_total]}>{fmtQty(l.line_total)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={s.totalsBox}>
          <View style={s.totalsRow}>
            <Text style={s.totalsLabel}>المجموع الفرعي</Text>
            <Text style={s.totalsValue}>{fmtEGP(inv.subtotal)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={[s.totalsLabel, s.totalsDeduction]}>خصم الضمان ({inv.retention_pct}%)</Text>
            <Text style={[s.totalsValue, s.totalsDeduction]}>− {fmtEGP(inv.retention_amt)}</Text>
          </View>
          <View style={s.totalsRow}>
            <Text style={[s.totalsLabel, s.totalsDeduction]}>ضريبة القيمة المضافة ({inv.tax_pct}%)</Text>
            <Text style={[s.totalsValue, s.totalsDeduction]}>− {fmtEGP(inv.tax_amt)}</Text>
          </View>
          <View style={[s.totalsRow, s.totalsNet]}>
            <Text style={s.totalsNetLabel}>صافي المستحق</Text>
            <Text style={s.totalsNetValue}>{fmtEGP(inv.net_payable)}</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <Text style={s.footerText}>أنشأه: {inv.created_by}</Text>
          <Text style={s.footerText}>FieldOps FTTH — مستخلص رسمي — {new Date().toLocaleDateString('ar-EG')}</Text>
        </View>

      </Page>
    </Document>
  )
}
