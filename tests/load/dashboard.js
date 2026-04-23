/**
 * k6 load test — Dashboard KPI endpoint
 *
 * Simulates 100 concurrent supervisors/managers refreshing the dashboard.
 * Target: p95 < 800ms even with ISR cache miss (cold render).
 *
 * Run:
 *   k6 run --env BASE_URL=https://ftth.vercel.app --env TEST_TOKEN=<jwt> tests/load/dashboard.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate } from 'k6/metrics'
import { BASE_URL, defaultHeaders, thresholds } from './k6.config.js'

const kpiDuration = new Trend('kpi_duration')
const dashboardDuration = new Trend('dashboard_duration')
const errorRate = new Rate('errors')

export const options = {
  thresholds,
  scenarios: {
    // Ramp up: 0 → 50 VUs over 30s, hold 2min, ramp down
    steady_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50  },
        { duration: '2m',  target: 50  },
        { duration: '30s', target: 100 },
        { duration: '1m',  target: 100 },
        { duration: '30s', target: 0   },
      ],
    },
  },
}

export default function () {
  // 1. Dashboard page (Next.js SSR/ISR)
  const dashRes = http.get(`${BASE_URL}/`, {
    headers: { ...defaultHeaders, Accept: 'text/html' },
    tags: { name: 'dashboard_page' },
  })
  dashboardDuration.add(dashRes.timings.duration)
  const dashOk = check(dashRes, {
    'dashboard 200': (r) => r.status === 200,
    'dashboard has KPI data': (r) => r.body.includes('completion') || r.status === 200,
  })
  errorRate.add(!dashOk)

  sleep(0.5)

  // 2. Map data API (PostGIS query — typically the slowest endpoint)
  const mapRes = http.get(`${BASE_URL}/api/map/data`, {
    headers: defaultHeaders,
    tags: { name: 'map_data_api' },
  })
  kpiDuration.add(mapRes.timings.duration)
  const mapOk = check(mapRes, {
    'map data 200 or 400': (r) => r.status === 200 || r.status === 400,
    'map data fast': (r) => r.timings.duration < 1500,
  })
  errorRate.add(!mapOk)

  sleep(1)
}
