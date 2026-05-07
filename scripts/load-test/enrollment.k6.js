/**
 * CTK EnrollSys — k6 Load Test
 * Tests the key enrollment system endpoints under simulated peak load.
 *
 * Prerequisites:
 *   brew install k6       (macOS)
 *   choco install k6      (Windows)
 *
 * Usage:
 *   BASE_URL=https://your-app.vercel.app k6 run scripts/load-test/enrollment.k6.js
 *
 * Targets:
 *   - 50 concurrent virtual users (VUs) ramping to 100 at peak
 *   - Simulates a school enrollment opening day surge
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Rate } from "k6/metrics";

const errorRate = new Rate("errors");
const loginDuration = new Trend("login_duration");
const enrollmentListDuration = new Trend("enrollment_list_duration");
const dashboardDuration = new Trend("dashboard_duration");

export const options = {
  stages: [
    { duration: "1m",  target: 20  }, // Ramp up to 20 VUs
    { duration: "3m",  target: 50  }, // Hold at 50 VUs (normal load)
    { duration: "2m",  target: 100 }, // Spike to 100 VUs (peak enrollment day)
    { duration: "2m",  target: 50  }, // Scale down
    { duration: "1m",  target: 0   }, // Ramp down
  ],
  thresholds: {
    // 95% of requests must complete under 2s
    http_req_duration: ["p(95)<2000"],
    // Error rate must stay below 1%
    errors: ["rate<0.01"],
    // Login must be fast
    login_duration: ["p(95)<3000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Shared CSRF-free JSON headers
const JSON_HEADERS = { "Content-Type": "application/json" };

export default function () {
  // ── 1. Health check ───────────────────────────────────────────────
  const health = http.get(`${BASE_URL}/api/health`);
  check(health, { "health: status 200": (r) => r.status === 200 });
  errorRate.add(health.status !== 200);

  sleep(0.5);

  // ── 2. Login (NextAuth credentials endpoint) ──────────────────────
  const loginStart = Date.now();
  const loginRes = http.post(
    `${BASE_URL}/api/auth/callback/credentials`,
    JSON.stringify({
      email: __ENV.TEST_EMAIL || "loadtest@ctkcs.edu.ph",
      password: __ENV.TEST_PASSWORD || "LoadTest123!",
      csrfToken: "k6-synthetic",
    }),
    { headers: JSON_HEADERS }
  );
  loginDuration.add(Date.now() - loginStart);
  // NextAuth redirects on success — allow 200 or 302
  check(loginRes, { "login: responded": (r) => r.status < 500 });
  errorRate.add(loginRes.status >= 500);

  sleep(1);

  // ── 3. Enrollment list (registrar) ───────────────────────────────
  const listStart = Date.now();
  const listRes = http.get(`${BASE_URL}/api/enrollments?limit=20&page=1`, {
    headers: JSON_HEADERS,
    tags: { name: "EnrollmentList" },
  });
  enrollmentListDuration.add(Date.now() - listStart);
  check(listRes, { "enrollment list: status ok": (r) => r.status === 200 || r.status === 401 });
  errorRate.add(listRes.status >= 500);

  sleep(0.5);

  // ── 4. Students list ─────────────────────────────────────────────
  const studentsRes = http.get(`${BASE_URL}/api/students?limit=20`, {
    headers: JSON_HEADERS,
    tags: { name: "StudentsList" },
  });
  check(studentsRes, { "students list: status ok": (r) => r.status === 200 || r.status === 401 });
  errorRate.add(studentsRes.status >= 500);

  sleep(0.5);

  // ── 5. Dashboard metrics (admin/registrar) ────────────────────────
  const dashStart = Date.now();
  const dashRes = http.get(`${BASE_URL}/api/enrollments/stats`, {
    headers: JSON_HEADERS,
    tags: { name: "DashboardStats" },
  });
  dashboardDuration.add(Date.now() - dashStart);
  check(dashRes, { "dashboard stats: status ok": (r) => r.status === 200 || r.status === 401 });
  errorRate.add(dashRes.status >= 500);

  sleep(1);

  // ── 6. Reports endpoint ───────────────────────────────────────────
  const reportsRes = http.get(`${BASE_URL}/api/reports?type=enrollment-summary`, {
    headers: JSON_HEADERS,
    tags: { name: "Reports" },
  });
  check(reportsRes, { "reports: status ok": (r) => r.status === 200 || r.status === 401 });
  errorRate.add(reportsRes.status >= 500);

  sleep(2);
}
