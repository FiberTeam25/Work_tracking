/**
 * k6 load test — Invoice generation + PDF/Excel export
 *
 * Simulates end-of-month invoice generation under load.
 * This is a write-heavy test — each VU generates a unique invoice.
 * Low concurrency intentional (invoice generation is expensive SQL).
 *
 * Run:
 *   k6 run --env BASE_URL=https://ftth.vercel.app --env TEST_TOKEN=<jwt> tests/load/invoice.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { BASE_URL, defaultHeaders, thresholds } from './k6.config.js'

const generateDuration = new Trend('invoice_generate_duration')
const pdfDuration = new Trend('invoice_pdf_duration')
const excelDuration = new Trend('invoice_excel_duration')
const errorRate = new Rate('invoice_errors')

export const options = {
  thresholds: {
    invoice_generate_duration: ['p(95)<3000'],  // generation involves heavy SQL aggregation
    invoice_pdf_duration:      ['p(95)<5000'],  // react-pdf rendering is CPU-bound
    invoice_excel_duration:    ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
  scenarios: {
    // Finance team generating reports: max 10 concurrent
    finance_team: {
      executor: 'constant-vus',
      vus: 10,
      duration: '3m',
    },
  },
}

export default function () {
  // Step 1: Generate invoice for current month
  const today = new Date()
  const periodStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
  const periodEnd = today.toISOString().split('T')[0]

  const genRes = http.post(
    `${BASE_URL}/api/invoices/generate`,
    JSON.stringify({
      period_start: periodStart,
      period_end: periodEnd,
      notes: 'k6 load test invoice',
    }),
    {
      headers: defaultHeaders,
      tags: { name: 'invoice_generate' },
      timeout: '10s',
    }
  )
  generateDuration.add(genRes.timings.duration)

  const genOk = check(genRes, {
    'generate 200 or 422': (r) => r.status === 200 || r.status === 422,
    'generate fast enough': (r) => r.timings.duration < 5000,
  })
  errorRate.add(!genOk)

  // If invoice was created, test PDF + Excel export
  if (genRes.status === 200) {
    let invoiceId
    try {
      invoiceId = JSON.parse(genRes.body)?.invoice?.id
    } catch { /* skip export */ }

    if (invoiceId) {
      sleep(0.5)

      // PDF export
      const pdfRes = http.get(`${BASE_URL}/api/invoices/${invoiceId}/pdf`, {
        headers: { ...defaultHeaders, Accept: 'application/pdf' },
        tags: { name: 'invoice_pdf' },
        timeout: '15s',
      })
      pdfDuration.add(pdfRes.timings.duration)
      check(pdfRes, {
        'pdf 200': (r) => r.status === 200,
        'pdf content-type': (r) => r.headers['Content-Type']?.includes('pdf') ?? false,
      })

      sleep(0.5)

      // Excel export
      const xlsxRes = http.get(`${BASE_URL}/api/invoices/${invoiceId}/excel`, {
        headers: { ...defaultHeaders, Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        tags: { name: 'invoice_excel' },
        timeout: '10s',
      })
      excelDuration.add(xlsxRes.timings.duration)
      check(xlsxRes, {
        'excel 200': (r) => r.status === 200,
        'excel size > 0': (r) => r.body.length > 100,
      })
    }
  }

  sleep(3)
}
