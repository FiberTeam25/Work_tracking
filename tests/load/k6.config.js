// k6 shared configuration — imported by each test script
// Run: k6 run --env BASE_URL=https://ftth.vercel.app tests/load/<script>.js

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
export const TEST_TOKEN = __ENV.TEST_TOKEN || ''   // Supabase JWT for authenticated routes

export const thresholds = {
  // 95th percentile response time under 800ms for all requests
  http_req_duration: ['p(95)<800'],
  // Error rate below 1%
  http_req_failed: ['rate<0.01'],
}

export const defaultHeaders = {
  'Content-Type': 'application/json',
  ...(TEST_TOKEN ? { Authorization: `Bearer ${TEST_TOKEN}` } : {}),
}
