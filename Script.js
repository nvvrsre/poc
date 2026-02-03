import http from "k6/http";
import { check, group } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// í´‘ IMPORTANT: rename imported options
import { options as baseOptions } from "./options.js";

// âœ… CI-safe override (Option B)
export const options = {
  ...baseOptions,

  thresholds: {
    http_req_failed: baseOptions.thresholds.http_req_failed,
    checks: baseOptions.thresholds.checks,

    api_01_success_rate: baseOptions.thresholds.api_01_success_rate,
    api_02_success_rate: baseOptions.thresholds.api_02_success_rate,
    api_03_success_rate: baseOptions.thresholds.api_03_success_rate,
    api_04_success_rate: baseOptions.thresholds.api_04_success_rate,
    api_05_success_rate: baseOptions.thresholds.api_05_success_rate,
  },
};

// ------------------------------------------------------------------
// API Configuration
// ------------------------------------------------------------------
const apiConfig = {
  API_01: {
    tag: "GET_USERS",
    displayName: "Users",
    url: "https://fake-json-api.mock.beeceptor.com/users",
    description: "Fetch Users API",
  },
  API_02: {
    tag: "GET_COMPANIES",
    displayName: "Companies",
    url: "https://fake-json-api.mock.beeceptor.com/companies",
    description: "Fetch Companies API",
  },
  API_03: {
    tag: "GET_TODOS",
    displayName: "Todos",
    url: "https://dummy-json.mock.beeceptor.com/todos",
    description: "Fetch Todos API",
  },
  API_04: {
    tag: "GET_POSTS",
    displayName: "Posts",
    url: "https://dummy-json.mock.beeceptor.com/posts",
    description: "Fetch Posts API",
  },
  API_05: {
    tag: "GET_CONTINENTS",
    displayName: "Continents",
    url: "https://dummy-json.mock.beeceptor.com/continents",
    description: "Fetch Continents API",
  },
};

// ------------------------------------------------------------------
// Custom Metrics
// ------------------------------------------------------------------
const api01Duration = new Trend("api_01_duration");
const api01Requests = new Counter("api_01_requests");
const api01SuccessRate = new Rate("api_01_success_rate");

const api02Duration = new Trend("api_02_duration");
const api02Requests = new Counter("api_02_requests");
const api02SuccessRate = new Rate("api_02_success_rate");

const api03Duration = new Trend("api_03_duration");
const api03Requests = new Counter("api_03_requests");
const api03SuccessRate = new Rate("api_03_success_rate");

const api04Duration = new Trend("api_04_duration");
const api04Requests = new Counter("api_04_requests");
const api04SuccessRate = new Rate("api_04_success_rate");

const api05Duration = new Trend("api_05_duration");
const api05Requests = new Counter("api_05_requests");
const api05SuccessRate = new Rate("api_05_success_rate");

// ------------------------------------------------------------------
// Test Logic
// ------------------------------------------------------------------
export default function () {
  group("API Load Test", function () {
    const runApi = (api, durationMetric, requestMetric, successMetric) => {
      const res = http.get(api.url, { tags: { name: api.tag } });

      durationMetric.add(res.timings.duration);
      requestMetric.add(1);
      successMetric.add(res.status === 200);

      check(res, {
        [`${api.displayName} status is 200`]: (r) => r.status === 200,
      });
    };

    runApi(apiConfig.API_01, api01Duration, api01Requests, api01SuccessRate);
    runApi(apiConfig.API_02, api02Duration, api02Requests, api02SuccessRate);
    runApi(apiConfig.API_03, api03Duration, api03Requests, api03SuccessRate);
    runApi(apiConfig.API_04, api04Duration, api04Requests, api04SuccessRate);
    runApi(apiConfig.API_05, api05Duration, api05Requests, api05SuccessRate);
  });
}

// ------------------------------------------------------------------
// Summary & Benchmark Logic
// ------------------------------------------------------------------
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const reportName = `report_${timestamp}.html`;

  const BENCHMARK_RPS_PER_API = 5;
  const totalBenchmarkRPS = BENCHMARK_RPS_PER_API * 5;
  const actualRPS = data.metrics.http_reqs?.values?.rate || 0;
  const benchmarkMet = actualRPS >= totalBenchmarkRPS;

  const benchmarkHTML = `
    <div style="margin:20px;padding:20px;border-radius:8px;
      background:${benchmarkMet ? "#d4edda" : "#f8d7da"};
      border:2px solid ${benchmarkMet ? "#28a745" : "#dc3545"};">
      <h2>${benchmarkMet ? "âœ“ TEST PASSED" : "âœ— TEST FAILED"}</h2>
      <p><b>Target:</b> ${totalBenchmarkRPS} RPS</p>
      <p><b>Actual:</b> ${actualRPS.toFixed(2)} RPS</p>
    </div>
  `;

  const standardReport = htmlReport(data);
  const enhancedReport = standardReport.replace("<body>", `<body>${benchmarkHTML}`);

  return {
    [reportName]: enhancedReport,
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}
