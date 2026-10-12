# Verification record

Date: 12 October 2026  
Environment: Apple silicon Mac, local Docker/Supabase, Next.js 16.3.5

## Code quality

| Check | Result |
| --- | --- |
| `npm ci` | Completed; 368 packages installed from lockfile |
| `npm run lint` | Passed with no project-code errors |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; optimized production build created |

## Local service health

| Service / route | Result |
| --- | --- |
| `http://localhost:3000/` | HTTP 200 |
| `http://localhost:3000/demo/student` | HTTP 200 |
| `http://localhost:3000/demo/registrar` | HTTP 200 |
| `http://127.0.0.1:54323/` | HTTP 200 after Studio redirect |

## Database verification

| Item | Result |
| --- | ---: |
| Terms | 1 |
| Courses | 21 |
| Course sections | 24 |
| Fall 2026 registration closes | 30 November 2026, 11:30 UTC |
| Fall 2026 drop deadline | 5 December 2026, 11:30 UTC |

## JMeter baseline

Plan: 20 users, 10-second ramp-up, 5 loops, 3 GET samplers per loop.

| Samples | Mean | Median | Min | Max | Throughput | Error rate |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 300 | 53.9 ms | 39.5 ms | 20 ms | 308 ms | 17.58 requests/s | 0.00% |

The raw `.jtl` and generated HTML dashboard remain in the ignored local
`testing/jmeter/results` folder. Timings describe this local development run only.

## Pending student verification

- Execute the final Selenium IDE suite and capture the green result.
- Perform one live authenticated Student registration/drop and capture UI/API/database evidence.
- Publish and verify GitHub and Google Drive links in an incognito browser.

