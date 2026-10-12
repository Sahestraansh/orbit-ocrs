# Orbit Online Course Registration System — Project Report Draft

> This source follows the faculty's required table of contents. It is not yet the
> final Word document. Text marked `[[...]]` needs student information, screenshots,
> final Selenium execution evidence, or published links before submission.

## Cover information still required

- Project title: **Orbit — Online Course Registration System**
- Student name: `[[FULL NAME]]`
- Registration number: `[[REGISTRATION NUMBER]]`
- Programme / department: `[[PROGRAMME AND DEPARTMENT]]`
- Course code and title: `[[COURSE CODE AND TITLE]]`
- Faculty guide: `[[FACULTY NAME]]`
- University: `[[UNIVERSITY NAME]]`
- Semester / academic year: `[[SEMESTER AND ACADEMIC YEAR]]`
- Submission date: `[[SUBMISSION DATE]]`

## Executive summary

Orbit is a full-stack prototype of an Online Course Registration System designed for
Students, Faculty members, Registrars, and System Administrators. The project addresses
fragmented course discovery, inconsistent seat information, schedule uncertainty, and
weak access separation by bringing the main registration tasks into one role-based web
application. The system uses Next.js, React, and TypeScript for its interface and
server routes. A local Supabase stack supplies PostgreSQL, authentication, REST
services, Row Level Security (RLS), and a visual database management interface through
Supabase Studio. Docker Desktop hosts the local backend services.

The catalogue is not stored as a hard-coded frontend array. A validated CSV file is
mapped into normalized `terms`, `courses`, and `course_sections` tables. Student
registration and drop requests pass through a validated Next.js API and locked
PostgreSQL transaction functions. The functions check the registration window, holds,
credit load, schedule conflicts where structured meetings exist, and section capacity,
then update the registration/waitlist, section count, and audit log atomically.

Testing includes a repeatable Selenium IDE functional suite and an Apache JMeter load
plan. A local JMeter baseline on 12 October 2026 executed 300 HTTP samples with 0%
errors, 53.9 ms mean response time, and 17.58 requests/second throughput. These results
describe the development computer and are not a production service-level guarantee.

# 1. Introduction

## 1.1 Background and motivation

University course registration is a high-pressure process in which students must find
suitable subjects, compare schedules, satisfy academic rules, and obtain limited seats
within a short period. Faculty require an accurate view of assigned classes and
rosters, Registrars require control of terms and offerings, and administrators require
secure role management and auditability. When these capabilities are separated across
spreadsheets, legacy portals, and manual approval channels, users receive conflicting
information and staff must spend time reconciling records.

Orbit was motivated by the need for one calm, responsive and accountable registration
experience. The design emphasizes a clear Student workflow while retaining distinct
workspaces for operational roles. It also treats authorization as a backend concern:
navigation visibility alone is not considered a security control.

## 1.2 Problem statement

The existing registration experience can suffer from delayed seat information,
confusing navigation, manual schedule comparison, weak separation between roles, and
limited traceability of sensitive operations. A student may attempt to select a full
or conflicting section, while university staff need reliable enrollment information
and an audit trail. The problem is to design and implement a reproducible web-based
system that presents current catalogue data, supports role-appropriate workflows,
performs registration changes consistently, and protects records at both the
application and database layers.

## 1.3 Objectives

The project objectives are:

1. Provide a responsive, accessible landing page and consistent role-based workspace.
2. Authenticate local demonstration users and separate identity from authorization.
3. Enforce Student, Faculty, Registrar, and System Administrator permissions.
4. Replace hard-coded catalogue records with validated CSV-backed database data.
5. Allow Students to search courses, inspect availability, and add or drop sections.
6. Execute registration updates as atomic database transactions with audit records.
7. Present Faculty, Registrar, and Administrator views tailored to their responsibilities.
8. Make the schema reproducible with versioned migrations and local Docker services.
9. Verify key workflows with Selenium IDE and basic performance with JMeter.
10. Document setup, architecture, testing, limitations, and future deployment clearly.

## 1.4 Scope and limitations

The implemented scope includes a public landing page, local email/password
demonstration authentication, trusted role assignment, four role workspaces,
database-backed catalogue views, Student add/drop operations, waitlist support,
transactional capacity updates, RLS policies, audit logs, CSV import, responsive
styling, and repeatable test assets.

The project is an academic prototype, not a live university deployment. University
SAML metadata, a Student Information System (SIS) API, and a hosted payment provider
require institution-specific contracts and credentials and are therefore represented
as integration-ready designs rather than active external connections. Several
Registrar/Administrator interface actions illustrate future workflows. Complete
conflict checking requires every section to have structured `section_meetings` rows,
and formal prerequisite enforcement needs an additional verified transaction rule.
The current performance measurements use a local development server and cannot be
generalized to production infrastructure.

# 2. Literature Survey / Existing System

## 2.1 Review of existing systems

Course registration capabilities commonly appear as modules in Student Information
Systems or university Enterprise Resource Planning portals. Their strength is
integration with official identity, academic history, fees, and records. However,
older portals may expose dense forms, delayed feedback, or workflows organized around
administrative records rather than student decisions. Commercial learning platforms
typically focus on course delivery after enrollment and are not substitutes for an
authoritative registration transaction system.

Modern web architecture separates presentation, validated service endpoints, identity,
and persistent data. Server-rendered React frameworks support accessible interfaces and
route-level checks. PostgreSQL provides constraints, transactions, locks, functions,
and Row Level Security. Supabase combines PostgreSQL with authentication, API services,
migrations, and a dashboard while retaining SQL as the source of truth. Selenium IDE
supports repeatable browser interaction testing, whereas JMeter measures response time,
throughput, percentiles, and error rate under concurrent request load.

The project follows established requirements engineering guidance by maintaining
traceability from user roles and functional requirements to modules and tests. It also
uses defence in depth: the interface communicates role context, server code verifies
the current role, and database policies limit data operations.

## 2.2 Gaps identified and proposed solution

| Gap in a typical fragmented/legacy flow | Proposed Orbit response |
| --- | --- |
| Course data duplicated in pages or spreadsheets | Validated CSV import into normalized PostgreSQL tables |
| Role choice trusted in the browser | Role resolved after authentication from `user_roles` |
| Sensitive data hidden only by navigation | Protected server routes plus PostgreSQL RLS |
| Registration changes performed as separate updates | One locked database transaction function |
| Weak feedback about capacity or conflicts | Course detail drawer and rule-aware response messages |
| No clear proof of data change | Supabase Studio view plus append-only audit record |
| Desktop-only layout | Responsive navigation and mobile breakpoints |
| Ad hoc testing | Saved Selenium IDE and JMeter test plans |

The proposed solution is therefore a local full-stack application that can later be
moved to managed Supabase and Vercel without changing the core data model or user flow.

# 3. Software Process Model and Project Planning

## 3.1 SDLC model chosen with justification

The project uses the **Incremental Model with Agile sprint practices**. Each increment
produces a demonstrable slice of the system while preserving a common architecture:

1. foundation and landing-page increment;
2. authentication, role routing, and RLS increment;
3. CSV catalogue and Student workflow increment;
4. Faculty, Registrar, and Administrator increment;
5. transactional registration, audit, testing, and documentation increment.

This model was selected because role workspaces can be implemented and evaluated in
small vertical slices. Early previews support UI feedback without requiring every
backend integration. Security and database work can then be added behind stable user
flows. Compared with a strict one-pass Waterfall process, incremental delivery reduces
the risk of discovering usability or integration problems only at the end. Agile
practices—short iterations, a prioritized backlog, working demonstrations, and
retrospective fixes—were used within each increment.

## 3.2 Project schedule

| Week / sprint | Main activities | Deliverable |
| --- | --- | --- |
| 1 | Problem definition, SRS review, role/use-case identification | Requirements baseline |
| 2 | Architecture, data model, UI design tokens, repository setup | Design baseline |
| 3 | Landing page, role previews, responsive shell | Increment 1 demo |
| 4 | Local Supabase, authentication, role routing, RLS | Increment 2 demo |
| 5 | CSV validation/import, catalogue search, course details | Increment 3 demo |
| 6 | Live add/drop transactions and other role workspaces | Increment 4 demo |
| 7 | Selenium functional tests, bug fixes, JMeter plan | Verified release candidate |
| 8 | Documentation, screenshots, GitHub/video packaging | Final submission |

The final Word report should include a rendered Gantt chart based on this table.

## 3.3 Risk analysis

| Risk | Probability | Impact | Mitigation / response |
| --- | --- | --- | --- |
| Docker is closed during a demonstration | Medium | High | Startup checklist and pre-demo health check |
| Port 3000 already used by an older server | Medium | Medium | Stop the older terminal; keep one server instance |
| Local keys accidentally committed | Low | High | `.gitignore`, placeholder examples, pre-push `git status` review |
| Role bypass through UI-only controls | Medium | High | Server `requireRole` checks and RLS policies |
| Two users take the last seat | Low | High | `FOR UPDATE` row locking inside one transaction |
| CSV contains invalid or duplicate records | Medium | Medium | Validate all rows before writing; use stable upsert keys |
| Catalogue import overwrites live counts | Medium | High | Preserve `enrolled_count` unless explicit replace flag is supplied |
| Test automation fails due browser event compatibility | Medium | Medium | React-compatible `runScript` input setter; stable selectors |
| Local load result mistaken for production capacity | Medium | Medium | State environment and limitations beside all metrics |
| External SSO/SIS/payment service unavailable | High for prototype | High for production | Keep adapters/integration ledger; use local safe demo mode |

## 3.4 Cost and effort estimation (optional)

This is a student prototype using open-source/local tooling, so direct software licence
cost is approximately zero. Existing laptop, electricity, storage, and internet access
are treated as available academic resources. A planning estimate for one student is
approximately 160–200 person-hours across requirements, design, implementation,
testing, debugging, and documentation. This is an indicative effort estimate, not a
billed commercial cost. A production deployment would add managed hosting, domain,
monitoring, identity integration, security review, support, and maintenance costs.

# 4. Requirements Analysis

## 4.1 Functional requirements

| ID | Requirement | Implemented module |
| --- | --- | --- |
| FR-01 | The system shall provide one public entry point and secure sign-in action. | `src/app/page.tsx`, auth actions |
| FR-02 | The system shall authenticate local demo users and support future university SSO. | Supabase Auth, `src/app/auth` |
| FR-03 | The system shall assign one trusted role to each user. | `user_roles`, local account action |
| FR-04 | The system shall route authenticated users to the assigned workspace. | `/dashboard`, `requireRole()` |
| FR-05 | Students shall search the current catalogue by code, title, or instructor. | Student catalogue view |
| FR-06 | Students shall view section details, credits, capacity, room, schedule, and instructor. | Course drawer |
| FR-07 | Students shall request course registration or waitlisting. | POST API and `register_for_section` |
| FR-08 | Students shall drop a registered section. | DELETE API and `drop_registration` |
| FR-09 | Students shall view a weekly schedule and registration totals. | My schedule view |
| FR-10 | Faculty shall view assigned sections and permitted rosters. | Faculty workspace and RLS |
| FR-11 | Registrars shall view offerings, enrollment, capacity, and reports. | Registrar workspace |
| FR-12 | Administrators shall review users/roles, service health, and audit information. | Administrator workspace |
| FR-13 | The system shall import validated course data from CSV. | `import-course-catalog.mjs` |
| FR-14 | Registration shall enforce applicable window, hold, credit, conflict, and capacity rules. | PostgreSQL transaction function |
| FR-15 | Sensitive actions shall produce audit records. | `audit_logs` and functions |
| FR-16 | Unauthorized users shall be denied protected routes and rows. | server checks and RLS |
| FR-17 | The system shall provide local reproducible setup and test assets. | migrations, docs, Selenium/JMeter |

## 4.2 Non-functional requirements

### Security

- Secret/service credentials must never enter browser code or public Git history.
- Every protected page must verify the authenticated identity and assigned role.
- Exposed tables must use RLS; anonymous users must not query application records.
- Inputs must be validated and errors must avoid leaking internal credentials.
- Security-sensitive operations must be auditable.

### Reliability and data integrity

- Registration updates must be atomic and concurrency-safe.
- Database constraints must prevent invalid status/capacity relationships.
- Catalogue re-import must not erase current enrollment counts unintentionally.
- Versioned migrations must recreate the database structure.

### Performance

- Common local pages should return without errors under a basic 20-user load.
- Response time, percentiles, throughput, and error percentage must be recorded.
- Production capacity targets must be established only after deployment-level testing.

### Usability and accessibility

- Navigation and status must not depend only on colour.
- Controls require meaningful labels and visible keyboard focus.
- Layout must remain usable on desktop and mobile widths.
- Loading, empty, success, warning, error, and forbidden states should be understandable.
- Reduced-motion preferences should be respected.

### Maintainability and portability

- TypeScript types, shared components, and normalized tables should reduce duplication.
- Configuration must come from environment variables.
- The same source should run locally and remain ready for managed Supabase/Vercel.

## 4.3 SRS summary

The SRS defines four principal actors and a shared catalogue/registration domain. The
Student is the primary transactional actor; Faculty, Registrar, and Administrator
roles have progressively broader operational visibility. Requirements are separated
into authentication/authorization, catalogue management, registration rules,
schedule/waitlist/payment presentation, auditability, availability, usability, and
integration readiness. Traceability is maintained through the functional-requirement
table, implementation modules, and test cases in Section 8.

## 4.4 Hardware and software requirements

### Hardware

- Apple silicon Mac or equivalent modern computer;
- recommended 8 GB RAM minimum, 16 GB preferred for Docker and IDE together;
- approximately 10 GB free storage for packages, images, and database volumes;
- internet connection for initial package/container installation;
- display capable of demonstrating desktop and responsive layouts.

### Software

- macOS (development environment used for this report);
- Node.js and npm;
- Docker Desktop;
- Supabase CLI included as a project dependency;
- Brave/Chromium-compatible browser;
- Visual Studio Code;
- Selenium IDE browser extension;
- Apache JMeter 5.6.x and a compatible Java runtime;
- Git and a GitHub account for submission.

# 5. System Design

## 5.1 System architecture

Orbit follows a layered web architecture. The browser renders the role workspace and
sends controlled requests. Next.js Server Components load protected page data and
route handlers validate mutations. Supabase Auth supplies the session. PostgreSQL
stores normalized records and enforces RLS. Registration functions keep multi-row
updates within one transaction. Docker Desktop runs PostgreSQL, Auth, REST, Studio,
and supporting local services.

`[[INSERT RENDERED ARCHITECTURE DIAGRAM FROM docs/DIAGRAMS.md]]`

## 5.2 Use case diagram

The use-case model separates self-service Student tasks from Faculty observation,
Registrar operations, and Administrator governance. All protected use cases include
authentication, and data access remains subject to the trusted role.

`[[INSERT RENDERED USE CASE DIAGRAM]]`

## 5.3 Class diagram

The application classes are represented by functional React components and service
modules rather than traditional Java-style domain objects. `RoleDashboard` composes
role views; the Student view calls the registration API; the API depends on auth and
Supabase clients; the importer and catalogue service interact with the same normalized
database through controlled clients.

`[[INSERT RENDERED CLASS DIAGRAM]]`

## 5.4 Sequence / activity diagrams

The registration sequence begins with a UI action and crosses the API, authentication,
role lookup, and database transaction. The corresponding activity diagram illustrates
decision points and success/failure outcomes. The database lock and transaction are
important because the browser alone cannot prevent a last-seat race.

`[[INSERT RENDERED REGISTRATION SEQUENCE DIAGRAM]]`

`[[INSERT RENDERED REGISTRATION ACTIVITY DIAGRAM]]`

## 5.5 ER diagram / database design

The schema separates identity/role records, academic catalogue, Student academic and
registration records, payments/notifications, and operational audit/integration data.
Many-to-many relationships such as Students-to-sections are resolved through
`registrations` and `waitlist_entries`. Foreign keys preserve referential integrity,
indexes support common filters, and RLS limits rows according to role and ownership.

`[[INSERT RENDERED ER DIAGRAM]]`

## 5.6 UI design / wireframes

The design scheme uses a gentle teal and mint base with blue, gold, and rose accents.
Rounded panels, restrained shadows, generous spacing, and readable type create a calm
academic interface. The desktop workspace uses a persistent sidebar; smaller screens
use a labelled mobile menu and scrim. Statuses include text as well as colour. The
landing page communicates the value proposition, single sign-in path, schedule preview,
and safe role demonstrations. The Student workspace prioritizes catalogue search,
course detail, registration feedback, and timetable visibility.

`[[INSERT W01, W02, W03, W04 AND W09 AS UI FIGURES]]`

# 6. Implementation

## 6.1 Technology stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React + Next.js App Router | Responsive pages, shared role dashboard, server rendering |
| Language | TypeScript | Typed client/server implementation |
| Validation | Zod | Registration request schema validation |
| Backend | Next.js Route Handlers | Controlled application API |
| Database | PostgreSQL through local Supabase | Transactions, constraints, functions, RLS |
| Authentication | Supabase Auth | Local accounts and future SAML SSO |
| Local runtime | Docker Desktop + Supabase CLI | Reproducible backend services |
| Data ingestion | Node.js CSV importer | Validation and normalized upserts |
| Functional testing | Selenium IDE | Browser workflow automation |
| Performance testing | Apache JMeter | Concurrent HTTP measurement |
| Deployment-ready target | Vercel + managed Supabase | Future production hosting |

## 6.2 Module description

| Module/file | Responsibility |
| --- | --- |
| `src/app/page.tsx` | Public landing page, local/SSO entry, role previews |
| `src/app/login/page.tsx` | Local sign-in and safe local account creation |
| `src/components/role-dashboard.tsx` | Shared role shell, role views, Student interactions |
| `src/app/dashboard/page.tsx` | Redirect authenticated identity to trusted workspace |
| `src/lib/auth.ts` | Resolve user/role and enforce protected routes |
| `src/proxy.ts` | Refresh cookie-based Supabase sessions |
| `src/lib/course-catalog.ts` | Query and map normalized catalogue rows |
| `src/app/api/registrations/route.ts` | Validate/authenticate add and drop requests |
| `scripts/import-course-catalog.mjs` | Validate CSV and upsert normalized records |
| `supabase/migrations/0001_initial_schema.sql` | Tables, constraints, indexes, RLS, transaction functions |
| `supabase/migrations/0002_csv_course_catalog.sql` | CSV-related catalogue fields and policies |
| `data/course_catalog.csv` | Editable source of term/course/section demonstration data |

## 6.3 Key code snippets

The final Word report should include only short excerpts with line references, not full
files. Recommended snippets:

1. Zod UUID validation and role check from `src/app/api/registrations/route.ts`.
2. The `fetch('/api/registrations')` call from `role-dashboard.tsx`.
3. The section `FOR UPDATE` and registration decision from
   `register_for_section` in the migration.
4. One representative RLS policy demonstrating ownership/role enforcement.
5. CSV validation plus a normalized upsert from the importer.

Full source belongs in the GitHub repository listed in Appendix A.

# 7. Software Tools Used (Demo Screenshots)

## 7.1 Visual Studio Code

**Purpose:** Code editing, project navigation, terminal execution, and static checking.

**Usage:** VS Code was used to implement and inspect TypeScript/React pages, API routes,
SQL migrations, the CSV importer, styling, and documentation. Its integrated terminals
ran npm, Supabase, lint, typecheck, and development commands.

`[[INSERT T01-vscode-registration-api.png]]`

## 7.2 Supabase Studio and Docker Desktop

**Purpose:** Docker runs isolated local backend services; Supabase Studio visually
inspects PostgreSQL tables, authentication users, policies, and functions.

**Usage:** The project uses a local Supabase stack instead of a cloud deployment.
Studio verified imported courses/sections, registration records, roles, and audit logs
before and after a live UI action.

`[[INSERT T02-supabase-studio.png AND OPTIONAL DOCKER SCREENSHOT]]`

## 7.3 Selenium IDE

**Purpose:** Record or define repeatable browser functional tests.

**Usage:** The saved suite verifies page load, role previews, catalogue filtering,
course details, schedule updates, protected-route behavior, and responsive navigation.
React-controlled input is set with a script to avoid the macOS `initKeyEvent` issue.

`[[INSERT T03-selenium-suite-passed.png]]`

## 7.4 Apache JMeter

**Purpose:** Generate concurrent HTTP requests and measure response time, percentiles,
throughput, and failures.

**Usage:** A 20-user, 10-second-ramp, five-loop plan requested three representative
pages for 300 total samples. The saved plan is in `testing/jmeter`.

`[[INSERT T04-jmeter-thread-group.png AND T05-jmeter-aggregate-report.png]]`

## 7.5 Git and GitHub

**Purpose:** Version control, source sharing, traceability, and submission access.

**Usage:** The clean repository contains source, migrations, CSV data, tests, and setup
documentation while `.gitignore` excludes secrets and generated files.

`[[INSERT T06-github-repository.png]]`

## 7.6 Tool summary table

| Tool | Purpose | SDLC phase | Usage in this project |
| --- | --- | --- | --- |
| VS Code | Development and inspection | Design, implementation, maintenance | Edited TSX/TS/SQL/CSV/docs and ran scripts |
| Docker Desktop | Local container runtime | Implementation, testing | Hosted local Supabase services |
| Supabase Studio | Database inspection | Implementation, testing | Verified schema and before/after data |
| Selenium IDE | Functional browser automation | Testing | Executed UI and access-control test cases |
| Apache JMeter | Load/performance testing | Testing | Measured three representative HTTP pages |
| Git/GitHub | Version control and source delivery | All phases / release | Published reproducible project source |

# 8. Testing

## 8.1 Test plan and strategy

Testing combines:

- static quality gates: ESLint and TypeScript checks;
- functional black-box tests in Selenium IDE;
- manual integration proof across UI, API, registration table, section counter, and audit log;
- RBAC negative testing for a protected route;
- a basic local JMeter load test;
- responsive visual inspection.

Functional tests start from a known URL and use stable semantic attributes or explicit
CSS/XPath locators. Each test states a visible expected result. Test execution should
use a clean browser session and a running local stack. Live data mutations should use a
dedicated demonstration Student account and a course whose registration state is known.

Performance testing uses 20 threads (virtual users), a 10-second ramp-up, and 5 loops.
Each loop requests `/`, `/demo/student`, and `/demo/registrar`; therefore 20 × 5 × 3 =
300 samples. Assertions require HTTP 200. A 250 ms think time separates representative
actions. The local development server and same-machine client/server arrangement are
recorded as test limitations.

## 8.2 Functional test cases

The Expected Result is fixed by the specification. “Actual Result” and “Status” for
Selenium must be filled from the student's final green execution, not assumed here.

| ID | Input / action | Expected output | Actual output | Status |
| --- | --- | --- | --- | --- |
| FT-01 | Open `/` | Landing page, correct title, local sign-in, role cards | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-02 | Open Student preview | Student role context and preview banner | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-03 | Search `MGT305` | Matching course remains; unrelated course filtered | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-04 | Select CSE301 | Drawer shows course code and capacity details | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-05 | Add MGT305 in preview | Success toast and MGT305 in My schedule | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-06 | Open Faculty preview | Faculty role and Dr. Arjun Menon assigned classes | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-07 | Open Registrar preview | Registration control centre and metrics | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-08 | Open Administrator preview | Administrator context, health/access panels | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-09 | Open `/student` without session | Redirect to landing page with sign-in notice | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| FT-10 | Use 390×844 viewport and open menu | Responsive sidebar opens and catalogue is reachable | `[[FINAL RUN]]` | `[[PASS/FAIL]]` |
| IT-01 | Live Student POST registration | Registration row, count update, audit row, success JSON | `[[SCREENSHOT EVIDENCE]]` | `[[PASS/FAIL]]` |
| IT-02 | Live Student DELETE drop | Registration marked dropped, count released, audit row | `[[SCREENSHOT EVIDENCE]]` | `[[PASS/FAIL]]` |

## 8.3 Test results and bug log

### Static verification

On 12 October 2026, `npm run lint`, `npm run typecheck`, and `npm run build`
completed with no errors in the clean final project folder. The optimized build
compiled successfully and generated the expected public, protected role, auth, demo,
and registration API routes.

### JMeter performance result — local baseline

| Label | Samples | Mean | Median | Min | Max | 90th percentile | Throughput | Error % |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| GET Landing Page | 100 | 57.41 ms | 44.5 ms | 32 ms | 283 ms | 89.3 ms | 6.27 req/s | 0.00% |
| GET Student Preview | 100 | 53.50 ms | 37.5 ms | 22 ms | 308 ms | 119.8 ms | 6.28 req/s | 0.00% |
| GET Registrar Preview | 100 | 50.79 ms | 36.0 ms | 20 ms | 236 ms | 90.9 ms | 6.29 req/s | 0.00% |
| **Total** | **300** | **53.90 ms** | **39.5 ms** | **20 ms** | **308 ms** | **90.9 ms** | **17.58 req/s** | **0.00%** |

Test environment: Apple silicon Mac, local Next.js 16.3.5 development server, local
Supabase/Docker services, Apache JMeter 5.6.3, same-machine network. Test timestamp:
12 October 2026. Results will differ on another run and must not be presented as a
production benchmark.

### Bug log

| Bug ID | Observation | Cause | Correction | State |
| --- | --- | --- | --- | --- |
| BUG-01 | `/student` build could not resolve `../../../` modules | Incorrect relative imports after file organization | Replaced with correct project aliases/import paths | Closed |
| BUG-02 | Faculty greeting showed Dr. Rao | Preview identity remained in initial sample data | Updated shared preview identity to Dr. Arjun Menon | Closed |
| BUG-03 | Selenium `type/sendKeys` failed with `initKeyEvent` | Selenium IDE/macOS compatibility with controlled React inputs | Set native input value and dispatched bubbling `input` event | Closed |
| BUG-04 | `waitForElementVisible` reported “Timeout not specified” | Timeout placed in wrong field or omitted | Added `30000` to the Value field | Closed |
| BUG-05 | Toast child selector timed out after add/drop | Toast closes quickly and child locator was brittle | Wait for status container and verify durable schedule/database state | Closed |
| BUG-06 | Live registration became unavailable after 25 Sep 2026 | Demonstration term window had passed | Extended demo registration/drop windows within Fall 2026 and re-imported CSV | Closed |

# 9. Results and Discussion

## 9.1 Output screenshots of the working system

Insert the figures listed in `SCREENSHOT_CHECKLIST.md`, particularly:

1. landing page;
2. Student overview and catalogue search;
3. course detail and schedule after live registration;
4. Faculty, Registrar, and Administrator workspaces;
5. responsive mobile navigation;
6. Supabase courses/sections, registration before/after, and audit log;
7. API Network request;
8. Selenium green run;
9. JMeter Thread Group and Aggregate Report.

Every figure needs a number, descriptive caption, and one sentence in the surrounding
text explaining why the evidence matters.

## 9.2 Analysis against objectives

| Objective | Evidence / result |
| --- | --- |
| Responsive role-based UI | Four role workspaces and mobile navigation implemented |
| Identity and authorization separation | Supabase Auth users plus trusted `user_roles` |
| Database-driven catalogue | 21 courses and 24 sections imported from CSV |
| Student search and registration | Search/drawer UI and live POST/DELETE API |
| Consistent transactions | Locked PostgreSQL functions update related records atomically |
| Auditability | Registration/drop functions append audit records |
| Reproducible local environment | Docker + Supabase migrations + importer + setup guides |
| Functional verification | Selenium IDE suite covering 10 safe workflows |
| Basic performance verification | 300 JMeter samples, 0 errors in the recorded local run |
| Submission readiness | Clean folder, README, GitHub guide, report and evidence checklist |

The prototype meets the principal academic objectives. Its strongest aspects are the
clear role model, normalized data source, transaction boundary, and reproducible local
backend. The main gap between prototype and production is not the UI but institutional
integration and assurance: real SAML/SIS/payment credentials, complete policy tests,
structured timetable data, prerequisite rules, monitoring, backups, and deployment-
level load/security testing are still required.

# 10. Conclusion and Future Enhancements

Orbit demonstrates that a course registration experience can be both approachable for
students and defensible at the backend. The final prototype combines a gentle,
responsive interface with trusted roles, server-side validation, PostgreSQL RLS,
atomic registration functions, CSV-backed catalogue data, and visible audit evidence.
The use of migrations and Docker makes the system reproducible on another development
machine, while the source remains ready for a later Vercel/managed Supabase workflow.

Future enhancements are:

1. configure university SAML SSO and verified institutional domains;
2. integrate the official SIS through idempotent synchronization jobs;
3. enforce prerequisites and all structured schedule conflicts inside the transaction;
4. implement reviewed registration overrides and waitlist promotion notifications;
5. integrate a PCI-compliant hosted payment provider without storing raw card data;
6. add automated database/RLS allow-and-deny tests and last-seat concurrency tests;
7. provide email/push notifications and calendar export;
8. add accessibility testing with keyboard, screen reader, zoom, and contrast tools;
9. deploy to managed Supabase and Vercel with monitoring, backups, alerts, and recovery plans;
10. conduct production-like capacity, penetration, privacy, and disaster-recovery tests.

# 11. References

[1] ISO/IEC/IEEE, “ISO/IEC/IEEE 29148:2018—Systems and software engineering—Life cycle
processes—Requirements engineering,” ISO, 2018.

[2] OWASP Foundation, “OWASP Application Security Verification Standard 4.0.3,”
Oct. 2021. [Online]. Available: https://owasp.org/www-project-application-security-verification-standard/

[3] Vercel, “Next.js documentation.” [Online]. Available: https://nextjs.org/docs.
[Accessed: Oct. 12, 2026].

[4] Supabase, “Supabase documentation.” [Online]. Available: https://supabase.com/docs.
[Accessed: Oct. 12, 2026].

[5] PostgreSQL Global Development Group, “PostgreSQL documentation.” [Online].
Available: https://www.postgresql.org/docs/. [Accessed: Oct. 12, 2026].

[6] Selenium, “Selenium IDE documentation.” [Online]. Available:
https://www.selenium.dev/selenium-ide/. [Accessed: Oct. 12, 2026].

[7] Apache Software Foundation, “Apache JMeter user manual.” [Online]. Available:
https://jmeter.apache.org/usermanual/. [Accessed: Oct. 12, 2026].

[8] Docker, Inc., “Docker Desktop documentation.” [Online]. Available:
https://docs.docker.com/desktop/. [Accessed: Oct. 12, 2026].

[9] Meta Platforms, Inc., “React documentation.” [Online]. Available:
https://react.dev/. [Accessed: Oct. 12, 2026].

[10] Microsoft, “TypeScript documentation.” [Online]. Available:
https://www.typescriptlang.org/docs/. [Accessed: Oct. 12, 2026].

# Appendix A: Project Links

- GitHub repository: `[[FINAL PUBLIC OR SHARED GITHUB URL]]`
- Demo video: `[[FINAL GOOGLE DRIVE VIDEO URL]]`

Verification statements to include only after checking:

- `[[GitHub link opened in a signed-out/incognito browser on DATE.]]`
- `[[Drive video played in a signed-out/incognito browser on DATE without requesting access.]]`

# Appendix B: Sample code listings (optional)

If required, include one-page excerpts of:

- `src/app/api/registrations/route.ts`;
- relevant part of `register_for_section`;
- representative RLS policy;
- CSV importer validation/upsert.

Do not paste the entire repository into the report. The complete code is supplied via
GitHub.
