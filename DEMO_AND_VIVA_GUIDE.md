# Orbit OCRS — Demo and Viva Guide

Use this guide to demonstrate the Online Course Registration System (OCRS). The project runs on this Mac using a local Supabase/PostgreSQL database.

## 1. Before the demonstration

1. Open **Docker Desktop** and wait until it is running.
2. Open Terminal in this project folder:

```bash
cd "/Users/sahestraanshtyagi/Desktop/Orbit-OCRS-Final-Submission"
npm run db:start
npm run db:import-csv
npm run dev
```

3. Keep the Terminal window open while demonstrating.
4. Open these pages in Brave:

- Website: `http://localhost:3000`
- Supabase Studio: `http://127.0.0.1:54323`
- GitHub: `https://github.com/Sahestraansh/orbit-ocrs`

Never show `.env.local`, passwords, publishable keys, secret keys, or authentication headers.

## 2. One-minute project introduction

Say:

> Orbit OCRS is a role-based online course registration system. Students can search the course catalogue, inspect course details, add or drop courses, and view their schedule. Faculty, Registrars, and Administrators have separate workspaces. The frontend uses Next.js and TypeScript. The backend uses local Supabase, which provides PostgreSQL, authentication, APIs, and database policies. Course data comes from a CSV file and is imported into database tables instead of being hard-coded in the interface.

## 3. Live demonstration order

### A. Landing page — 1 minute

1. Open `http://localhost:3000`.
2. Explain that the landing page is public.
3. Point out the Student, Faculty, Registrar, and Administrator preview cards.
4. Explain that previews demonstrate the interface without requiring users to sign in.

Say:

> The landing page is public. Protected workspaces use authentication and role checks, while previews allow a demonstration without changing live data.

### B. Student workspace — 3 minutes

1. Open `http://localhost:3000/demo/student`.
2. Show the Student Overview page.
3. Click **Course catalog** in the left navigation.
4. Search for `MGT305` or `CSE301`.
5. Click the matching course row.
6. Show the course-detail panel: course code, title, faculty, schedule, credits, and available seats.
7. Click **Add to my schedule**.
8. Click **My schedule** and show the course.
9. If required, reopen that course and click **Drop this course** to demonstrate removal.

Say:

> The catalogue data comes from the local PostgreSQL database. Registration actions use the registration API and database logic rather than storing data only in the visible page.

### C. Faculty, Registrar, and Administrator — 2 minutes

Open each route and show one important area.

| Role | Route | Explain |
| --- | --- | --- |
| Faculty | `/demo/faculty` | Faculty can view assigned classes, rosters, and timetable information. |
| Registrar | `/demo/registrar` | Registrar users manage offerings, capacities, registration windows, and reports. |
| Administrator | `/demo/system_admin` | Administrators monitor access, system information, and audit activity. |

### D. Database and CSV — 2 minutes

1. In VS Code, open `data/course_catalog.csv`.
2. Explain that each row represents a section offered in one term.
3. Open Supabase Studio: `http://127.0.0.1:54323`.
4. Choose **Table Editor**.
5. Show `courses`.
6. Show `course_sections`.
7. If you completed a live registration, show `registrations`.
8. Show `audit_logs` if activity entries are available.

Say:

> This is a local PostgreSQL database. Docker runs Supabase services on this computer. The CSV is validated by an import script and loaded into normalized tables such as courses and course_sections.

### E. Backend API — 1 minute

In VS Code, open:

`src/app/api/registrations/route.ts`

Say:

> This API route receives registration and drop requests. It validates input, checks the user's role, and calls database functions. Important registration rules are handled by PostgreSQL rather than relying only on frontend checks.

Optional API evidence:

1. In Brave, press `Option + Command + I`.
2. Open **Network**.
3. Add or drop a course.
4. Open the request called `registrations`.
5. Show the method and successful response only. Do not show sensitive headers.

### F. Testing and GitHub — 1 minute

1. Open Selenium IDE and show the suite with **Runs: 10, Failures: 0**.
2. Open JMeter Aggregate Report and show samples, average response time, throughput, and error percentage.
3. Open the GitHub repository.
4. Show the README, `src`, `supabase`, `data`, and `testing` folders.

## 4. Code files worth showing

Do not open every file. Show these files in this order.

| File | Purpose |
| --- | --- |
| `src/app/page.tsx` | Landing page. |
| `src/components/role-dashboard.tsx` | Shared dashboard interface for all roles. |
| `src/app/api/registrations/route.ts` | Registration and drop API route. |
| `src/lib/auth.ts` | Reads the signed-in user and applies role checks. |
| `src/lib/permissions.ts` | Defines application roles. |
| `src/lib/supabase/server.ts` | Creates the server-side Supabase client. |
| `data/course_catalog.csv` | Editable course and section data. |
| `scripts/import-course-catalog.mjs` | Validates and imports CSV data. |
| `supabase/migrations/0001_initial_schema.sql` | Core database tables and policies. |
| `supabase/migrations/0002_csv_course_catalog.sql` | Catalogue-related schema. |
| `testing/selenium/orbit-ocrs-functional-tests.side` | Selenium IDE functional tests. |
| `testing/jmeter/orbit-ocrs-load-test.jmx` | JMeter performance-test plan. |

## 5. Architecture explanation

Use this simple flow:

```text
Brave browser
      |
      v
Next.js frontend (pages and components)
      |
      v
Next.js API route (/api/registrations)
      |
      v
Local Supabase services in Docker
      |
      v
PostgreSQL database
```

The browser shows the interface. The API route handles registration requests. Supabase provides authentication and the PostgreSQL database. PostgreSQL stores the course, section, role, and registration records.

## 6. Local database explanation

A local database runs on the same computer rather than on an internet cloud server.

In this project:

- Docker starts Supabase locally.
- Supabase provides PostgreSQL, authentication, API support, and Studio.
- PostgreSQL stores structured data in related tables.
- Supabase Studio is a browser dashboard used to inspect those tables.
- The local database works while Docker and Supabase are running.

Useful commands:

```bash
npm run db:start       # Start local Supabase and PostgreSQL
npm run db:status      # Show local service URLs
npm run db:import-csv  # Import course data from the CSV
npm run db:stop        # Stop local Supabase services
```

## 7. RBAC explanation

RBAC means **Role-Based Access Control**. It ensures that users only access actions permitted for their role.

Orbit OCRS uses these roles:

- Student
- Faculty
- Registrar
- System administrator

The user role is stored in the `user_roles` table. Protected pages check the role on the server, and database policies add another layer of protection. Changing text in the browser cannot give a user more access.

## 8. Functional testing explanation

Selenium IDE tests these flows:

- Landing page opens
- Student preview opens
- Course search works
- Course details open
- Registration/schedule preview works
- Faculty workspace opens
- Registrar workspace opens
- Administrator workspace opens
- Protected route redirects an unauthenticated user
- Mobile navigation works

For the report, capture a screenshot showing **Runs: 10, Failures: 0**.

## 9. Performance testing explanation

The JMeter test sends requests to the landing page, Student preview, and Registrar preview.

Configuration:

- 20 virtual users
- 10-second ramp-up
- 5 loops per user
- 3 requests per loop
- 300 total HTTP samples

Explain the report terms:

- **Samples**: total HTTP requests sent.
- **Average**: average response time in milliseconds.
- **Throughput**: requests handled per second.
- **Error %**: percentage of unsuccessful requests.

## 10. Common viva questions

### What problem does the project solve?

It brings course discovery, registration, schedule viewing, and role-specific academic workflows into one system.

### Why use Next.js?

Next.js provides React user interfaces, routing, server-side features, and API routes in a single TypeScript project.

### Why use Supabase?

Supabase provides PostgreSQL, authentication, APIs, and a visual database dashboard. It is run locally with Docker for this project.

### What is PostgreSQL?

PostgreSQL is a relational database system. It stores data in linked tables and supports SQL queries, constraints, and transactions.

### Why use a CSV file?

The CSV is an editable source of course data. The import script validates the rows and stores them in database tables, so course details are not hard-coded into the user interface.

### What is an API in this project?

The registration API is `/api/registrations`. The frontend calls it for add/drop operations; it checks the request and calls the database.

### What is RBAC?

Role-Based Access Control gives different permissions to Students, Faculty, Registrars, and System administrators.

### What is the difference between frontend and backend?

The frontend is the browser interface. The backend handles authentication, API logic, and database access.

### What did Selenium test?

It tested functional user flows, including role pages, course search, course details, protected-route behaviour, and mobile navigation.

### What did JMeter test?

It tested basic performance under multiple concurrent requests and measured response time, throughput, and failures.

### What are the project limitations?

This is a local academic project. It does not use live university SSO, a real payment gateway, or a university SIS integration. Those would require approved production credentials and security review.

## 11. Troubleshooting

### Website does not open

1. Check the terminal running `npm run dev`.
2. If port 3000 is busy, use the Local URL printed by Next.js, such as `http://localhost:3001`.
3. If necessary, stop the old development server and run `npm run dev` again.

### Supabase Studio does not open

1. Confirm Docker Desktop is running.
2. Run:

```bash
npm run db:status
```

3. If required, run:

```bash
npm run db:start
```

### Course data is missing

Run:

```bash
npm run db:import-csv
```

Then refresh the website and Studio.

## 12. Final demonstration checklist

- Docker Desktop is running.
- `npm run db:start` completed.
- `npm run db:import-csv` completed.
- `npm run dev` is still running.
- The website opens in Brave.
- Supabase Studio opens in Brave.
- One catalogue search works.
- One registration/schedule flow is ready.
- Selenium shows 10 passes and 0 failures.
- JMeter Aggregate Report is ready.
- The public GitHub repository opens in an incognito window.
- The demo video link opens in an incognito window.

