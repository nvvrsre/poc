export const options = {
  scenarios: {
    ramping_arrival_rate_scenario: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { duration: "30s", target: 10 }, // Ramp up to 10 iterations per second
        { duration: "1m", target: 50 }, // Ramp up to 50 iterations per second
        { duration: "30s", target: 50 }, // Stay at 50 iterations per second
        { duration: "30s", target: 0 }, // Ramp down to 0 iterations per second
      ],
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1500"], // 95% of requests should be below 1500ms
    http_req_failed: ["rate<0.01"], // Error rate should be less than 1%
    checks: ["rate>0.99"], // 99% of checks should pass

    // Individual API thresholds for better visibility
    api_01_duration: [
      "p(95)<1200", // 95% of API_01 requests should be below 1200ms
      "p(99)<2000", // 99% of API_01 requests should be below 2000ms
      "avg<700", // Average response time should be below 700ms
    ],
    api_02_duration: ["p(95)<1200", "p(99)<2000", "avg<700"],
    api_03_duration: ["p(95)<1200", "p(99)<2000", "avg<700"],
    api_04_duration: ["p(95)<1200", "p(99)<2000", "avg<700"],
    api_05_duration: ["p(95)<1200", "p(99)<2000", "avg<700"],

    // Error rate thresholds for each API
    api_01_success_rate: ["rate>0.99"], // 99% success rate
    api_02_success_rate: ["rate>0.99"],
    api_03_success_rate: ["rate>0.99"],
    api_04_success_rate: ["rate>0.99"],
    api_05_success_rate: ["rate>0.99"],
  },
};
