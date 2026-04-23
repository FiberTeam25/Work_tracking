/**
 * k6 load test — Mobile sync endpoints (pull + push)
 *
 * Simulates 200 field technicians syncing concurrently after morning shift start.
 * This is the most critical load scenario: all technicians open the app at ~8am.
 *
 * Run:
 *   k6 run --env BASE_URL=https://ftth.vercel.app --env TEST_TOKEN=<jwt> tests/load/sync.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Trend, Rate, Counter } from 'k6/metrics'
import { BASE_URL, defaultHeaders, thresholds } from './k6.config.js'
import { uuidv4 } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js'

const pullDuration = new Trend('sync_pull_duration')
const pushDuration = new Trend('sync_push_duration')
const errorRate = new Rate('sync_errors')
const tasksSubmitted = new Counter('tasks_submitted')

export const options = {
  thresholds: {
    ...thresholds,
    sync_pull_duration: ['p(95)<1200'],  // pull can be slightly slower (PostGIS queries)
    sync_push_duration: ['p(95)<800'],
  },
  scenarios: {
    // Morning rush: 200 technicians starting their day
    morning_rush: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m',  target: 200 },  // all tech open app within 1 minute
        { duration: '3m',  target: 200 },  // sustained load
        { duration: '30s', target: 0   },
      ],
    },
  },
}

export default function () {
  // 1. Pull: get latest changes from server
  const lastPulledAt = Math.floor(Date.now() / 1000) - 3600  // 1h ago
  const pullRes = http.get(
    `${BASE_URL}/api/sync/pull?last_pulled_at=${lastPulledAt}`,
    {
      headers: defaultHeaders,
      tags: { name: 'sync_pull' },
    }
  )
  pullDuration.add(pullRes.timings.duration)
  const pullOk = check(pullRes, {
    'pull 200': (r) => r.status === 200,
    'pull has changes key': (r) => {
      try { return JSON.parse(r.body).changes !== undefined } catch { return false }
    },
  })
  errorRate.add(!pullOk)

  sleep(0.3)

  // 2. Push: submit 1–3 new tasks (simulates a technician's morning batch)
  const taskCount = Math.floor(Math.random() * 3) + 1
  const tasks = Array.from({ length: taskCount }, () => ({
    id: uuidv4(),
    task_type: Math.random() > 0.5 ? 'route' : 'node',
    task_date: new Date().toISOString().split('T')[0],
    route_length_m: Math.random() > 0.5 ? Math.floor(Math.random() * 500) + 50 : null,
    quantity: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : null,
    gps_lat: 30.0 + (Math.random() * 0.1),
    gps_lng: 31.4 + (Math.random() * 0.1),
    gps_accuracy_m: 3 + Math.random() * 5,
    is_synced: false,
    created_at_unix: Date.now(),
  }))

  const pushRes = http.post(
    `${BASE_URL}/api/sync/push`,
    JSON.stringify({
      changes: {
        tasks: { created: tasks, updated: [], deleted: [] },
        task_photos: { created: [], updated: [], deleted: [] },
        contract_items: { created: [], updated: [], deleted: [] },
        cabinets: { created: [], updated: [], deleted: [] },
      },
      lastPulledAt,
    }),
    {
      headers: defaultHeaders,
      tags: { name: 'sync_push' },
    }
  )
  pushDuration.add(pushRes.timings.duration)
  const pushOk = check(pushRes, {
    'push 200': (r) => r.status === 200,
    'push success': (r) => {
      try { return JSON.parse(r.body).success === true } catch { return false }
    },
  })
  errorRate.add(!pushOk)
  if (pushOk) tasksSubmitted.add(taskCount)

  sleep(2)
}
