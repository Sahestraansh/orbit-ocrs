# OCRS local database and full demonstration guide

This guide runs the complete project on one Mac. Nothing is uploaded to Supabase or Vercel.

## What “local” means

A local database is a database server running on your own computer. For this project:

- PostgreSQL stores the application data.
- Supabase Auth stores local test accounts and sessions.
- Supabase REST API exposes database operations.
- Supabase Studio provides a browser interface for viewing tables.
- Next.js provides the website and its custom registration API.
- Docker Desktop runs the database services in isolated containers.

The data stays in a Docker volume on this Mac. Internet access is not required after the software and Docker images have been downloaded.

## Local addresses

| Service | Address | Purpose |
| --- | --- | --- |
| Website | `http://localhost:3000` | The Orbit interface shown in Brave |
| Supabase API | `http://127.0.0.1:54321` | Auth and database REST API |
| PostgreSQL | `127.0.0.1:54322` | The database server itself |
| Supabase Studio | `http://127.0.0.1:54323` | Visual database viewer |
| Local email viewer | `http://127.0.0.1:54324` | Captures development emails |

## One-time setup

### 1. Install Docker Desktop

This Mac uses Apple silicon. Download Docker Desktop for **Mac with Apple silicon** from Docker’s official website.

1. Open the downloaded `Docker.dmg`.
2. Drag Docker into Applications.
3. Open Docker from Applications.
4. Accept the agreement and choose the recommended settings.
5. Wait until Docker reports that its engine is running.

Docker must be open whenever the local database is used.

### 2. Open the project

Open this folder in VS Code:

```text
/Users/sahestraanshtyagi/Desktop/Orbit-OCRS-Final-Submission
```

The Supabase command-line tool is already included in the project dependencies.

## Starting the complete application

Use two terminal tabs. Keep both running during the demonstration.

### Terminal 1: Start the local database

```bash
cd "/Users/sahestraanshtyagi/Desktop/Orbit-OCRS-Final-Submission"
npm run db:start
```

The first start downloads Docker images and can take several minutes. Later starts are much faster.

The command automatically:

1. Starts local PostgreSQL.
2. Starts local Supabase Auth and API services.
3. Runs every SQL file in `supabase/migrations`.
4. Creates the OCRS tables, functions, constraints, and RLS policies.
5. Runs the minimal SQL seed.
6. Starts Supabase Studio.

Import the validated course catalogue in the same terminal:

```bash
npx supabase migration up
npm run db:import-csv
```

Leave Terminal 1 open.

### Get the local keys

Run:

```bash
npm run db:status
```

Find these values in the output:

```text
API URL
Publishable key
Secret key
Studio URL
```

The publishable key is safe for the browser. The secret key is server-only and must never be exposed in a client component, screenshot, Git commit, or public document.

### Create `.env.local`

Duplicate `.env.local.example` and rename the copy to `.env.local`.

Fill it like this, using the keys printed by `npm run db:status`:

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=PASTE_THE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=PASTE_THE_SECRET_KEY
NEXT_PUBLIC_AUTH_MODE=local
UNIVERSITY_SSO_DOMAIN=
```

Do not place quotes around the values. Save the file.

### Terminal 2: Start the website

Open a second VS Code terminal and run:

```bash
cd "/Users/sahestraanshtyagi/Desktop/Orbit-OCRS-Final-Submission"
npm run dev
```

Wait for:

```text
Local: http://localhost:3000
Ready
```

### Open the website in Brave

1. Open Brave.
2. Press `Command + L`.
3. Enter `http://localhost:3000`.
4. Press Return.

The main button should say **Sign in to the local system**. If it still says university SSO, `.env.local` is missing or the website was not restarted after editing it.

## Creating local demonstration accounts

1. Select **Sign in to the local system**.
2. Select **Create a test account**.
3. Enter a name, email, and password of at least eight characters.
4. Choose a role.
5. Select **Create account**.

Suggested accounts:

| Role | Suggested email |
| --- | --- |
| Student | `student@ocrs.local` |
| Faculty | `faculty@ocrs.local` |
| Registrar | `registrar@ocrs.local` |
| System administrator | `admin@ocrs.local` |

Use a demonstration-only password. Do not reuse a real password.

Role selection is allowed only when `NEXT_PUBLIC_AUTH_MODE=local` and the Supabase URL points to localhost. It is deliberately rejected for a remote database.

## What the local database contains

### Identity and access

- `profiles`: name, university ID, programme, and credit limit.
- `user_roles`: Student, Faculty, Registrar, or System Administrator.

### Academic data

- `terms`: semester and registration dates.
- `courses`: course codes, titles, credits, and departments.
- `course_sections`: course offerings, rooms, capacity, instructor, and enrolled count.
- `section_meetings`: exact meeting days and times.
- `course_prerequisites`: prerequisite relationships.

### Registration data

- `registrations`: each student’s status in a course section.
- `waitlist_entries`: queue position when a section is full.
- `student_holds`: restrictions that block registration.
- `registration_overrides`: authorised exceptions.
- `academic_history`: completed courses and pass status.

### Operations

- `payment_transactions`: payment references and status, never raw card details.
- `notifications`: user messages.
- `audit_logs`: security-sensitive actions.
- `integration_events`: processed external events and idempotency records.

## How the database is created

The schema is not made manually in Studio. It is recreated from source-controlled SQL:

```text
supabase/config.toml
        ↓
Supabase CLI starts Docker containers
        ↓
0001_initial_schema.sql creates tables, functions, indexes, and policies
        ↓
seed.sql inserts safe demonstration data
        ↓
PostgreSQL stores rows in a persistent Docker volume
```

The principal schema file is:

```text
supabase/migrations/0001_initial_schema.sql
```

This makes the database reproducible. If the local database is erased, the same files can recreate it.

## How the API works

### Read operations

The authenticated Supabase client calls the local Supabase API at port `54321`. The user’s session token is sent with each request, and PostgreSQL Row Level Security decides which rows may be returned.

### Registration operation

When a Student adds a course:

```text
Add to my schedule
        ↓
POST /api/registrations
        ↓
Zod validates the section UUID
        ↓
Server verifies the Supabase session and Student role
        ↓
Database function register_for_section(section_id)
        ↓
Window, hold, credit, schedule, and capacity checks
        ↓
Registration or waitlist row is written
        ↓
Section count and audit log are updated atomically
        ↓
The website displays the result
```

Dropping a course uses `DELETE /api/registrations` and the `drop_registration` database function.

## Viewing the database during the demonstration

Open a second Brave tab and visit:

```text
http://127.0.0.1:54323
```

This is Supabase Studio for the local database.

Recommended sequence:

1. Open **Table Editor**.
2. Show `courses` with 21 CSV-imported courses and `course_sections` with 24 offered sections.
3. Show `course_sections`, including capacity and `enrolled_count`.
4. Show `profiles` and `user_roles` for the local account.
5. Before registering, show the current `registrations` rows.
6. Return to the website and add a course.
7. Refresh `registrations` in Studio and show the new row.
8. Refresh `course_sections` and show the increased `enrolled_count`.
9. Open `audit_logs` and show `registration.created`.
10. Drop the course and show the corresponding database changes.

## Demonstrating the CSV import

1. In VS Code, open `data/course_catalog.csv` and show the term, course, instructor, capacity, room, and schedule columns.
2. Validate it without changing the database:

   ```bash
   npm run db:import-csv -- --dry-run
   ```

3. Import it:

   ```bash
   npm run db:import-csv
   ```

4. Open Supabase Studio and refresh `terms`, `courses`, and `course_sections`.
5. Change a non-enrollment field in the CSV, such as a room, rerun the importer, and refresh Studio and the website.

Normal imports preserve existing `enrolled_count` values so catalogue edits cannot erase live registrations.

## Viewing the API during the demonstration

In Brave:

1. Open the Student course catalogue.
2. Press `Option + Command + I` to open Developer Tools.
3. Select the **Network** tab.
4. Filter by `registrations`.
5. Add a course.
6. Select the `/api/registrations` request.
7. Show the POST method, request body containing the section ID, and successful JSON response.
8. Drop the same course and show the DELETE request.

Do not show `.env.local` or authentication keys during the presentation.

## Showing the code in VS Code

Show the files in this order so the explanation follows one user action from front to back:

1. `src/app/page.tsx` — public landing page and local sign-in entry.
2. `src/app/login/page.tsx` — local account form.
3. `src/components/role-dashboard.tsx` — all role interfaces and student interactions.
4. `src/app/api/registrations/route.ts` — the custom registration API.
5. `src/lib/auth.ts` — server-side role enforcement.
6. `src/lib/supabase/server.ts` — cookie-aware database client.
7. `src/proxy.ts` — secure session refresh.
8. `supabase/migrations/0001_initial_schema.sql` — database structure, RLS, and transaction functions.
9. `supabase/seed.sql` — sample courses.
10. `supabase/config.toml` — local ports and Auth settings.

Useful talking points:

- Next.js renders the frontend and server routes.
- Supabase Auth verifies the user.
- `user_roles` stores trusted roles.
- Protected pages check roles on the server.
- RLS checks the same role again at the database level.
- Registration is transactional, preventing two students from taking the same last seat.
- The audit table records important actions.
- No raw card information is stored.

## Suggested 10-minute demonstration script

### Minute 0–1: Architecture

Say:

> “This application runs completely on my Mac. Brave displays the Next.js frontend on port 3000. A local Supabase stack provides PostgreSQL, authentication, REST APIs, and a database dashboard. Docker keeps those backend services isolated and reproducible.”

### Minute 1–3: Landing page and RBAC

1. Show the landing page.
2. Explain the local sign-in button.
3. Sign in as a Student.
4. Explain that the server reads `user_roles`; the browser does not choose a trusted role after login.
5. Briefly open the other role previews.

### Minute 3–5: Student workflow

1. Open Course catalog.
2. Search for a course.
3. Open its details.
4. Explain prerequisite, conflict, credit-limit, and capacity checks.
5. Add the course.
6. Open My schedule.

### Minute 5–7: API and database

1. Show the request in Brave Developer Tools.
2. Open local Supabase Studio.
3. Show the new registration row.
4. Show the updated section count.
5. Show the audit record.

### Minute 7–9: Code walkthrough

1. Show the main frontend component.
2. Show the registration API route.
3. Show `register_for_section` in the migration.
4. Show representative RLS policies.

### Minute 9–10: Reliability and security

Explain:

- Server-side authentication and role checks.
- RLS as the final authorization boundary.
- Transactional last-seat handling.
- Append-only audit history.
- Accessible and responsive interface.
- Reproducible database migrations and seed data.

## Stopping and restarting

Stop the website with `Control + C` in Terminal 2.

Stop the local database with:

```bash
npm run db:stop
```

The data is preserved in the Docker volume. On the next day:

```bash
npm run db:start
npm run dev
```

## Resetting the demonstration data

To erase local test accounts and registrations, rebuild the database, and reload seed data:

```bash
npm run db:reset
```

This is destructive, but only to this project’s local demonstration database. Never run a linked/remote reset command.

After a reset, create the local demonstration accounts again.

## Presentation checklist

- Docker Desktop is open and running.
- `npm run db:start` succeeds.
- `.env.local` contains the current local keys.
- `npm run dev` reports Ready.
- Brave opens `http://localhost:3000`.
- Studio opens `http://127.0.0.1:54323`.
- Student account exists.
- At least one course has an available seat.
- Brave Developer Tools is ready on the Network tab.
- VS Code has the ten walkthrough files open.
- `.env.local` is closed so secrets are not shown.
- Notifications and unrelated tabs are closed before presenting.
