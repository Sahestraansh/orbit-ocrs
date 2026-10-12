# Final demonstration and viva guide

The safest presentation is a short story that follows one Student action from the
interface to the API and database, then proves that other roles see different
workspaces. Practise this in your own words; do not memorise unexplained phrases.

## 1. What the project is

Orbit is a role-based Online Course Registration System. It serves four roles:
Student, Faculty, Registrar, and System Administrator. The implemented stack is
Next.js/React with TypeScript for the application, local Supabase for authentication,
PostgreSQL, REST services and Studio, and Docker Desktop for the local containers.

The major design decision is that a user does not choose a trusted role on the
landing page. After authentication, the server reads exactly one role from the
`user_roles` table. Protected pages check that role, and PostgreSQL Row Level Security
provides a second authorization boundary at the data layer.

## 2. Exact startup routine

1. Open Docker Desktop and wait for the engine to show **Running**.
2. Open the final folder in VS Code.
3. In Terminal 1 run:

   ```bash
   npm run db:start
   npm run db:import-csv
   ```

4. In Terminal 2 run:

   ```bash
   npm run dev
   ```

5. Open Brave tabs for:

   - `http://localhost:3000`
   - `http://127.0.0.1:54323`

6. Keep Selenium IDE and JMeter closed until their part of the demonstration so the
   screen is not cluttered.

If port 3000 is occupied, stop the older terminal with `Control + C`; do not continue
on 3001 unless `NEXT_PUBLIC_SITE_URL` and Selenium/JMeter are also changed.

## 3. Suggested 10–12 minute demonstration

### Minute 0–1: Problem and solution

Say:

> Course registration often becomes confusing when seat counts, schedule conflicts,
> and permissions are handled in separate systems. Orbit combines catalogue search,
> registration, timetable, role-specific operations, and an auditable backend in one
> interface.

Show the landing page and point to the single sign-in action, calm design, schedule
preview, and four safe role previews.

### Minute 1–4: Student workflow

1. Sign in with a local Student account for a live transaction. Use preview mode only
   if you are explaining the UI and do not intend to write to the database.
2. Confirm the sidebar says **Student**.
3. Open **Course catalog** and search for `MGT305`.
4. Open the course drawer and explain:
   - capacity and remaining seats come from `course_sections`;
   - prerequisites, conflict and credit checks are presented before registration;
   - the action is sent to the server, not inserted directly by the browser.
5. Open Brave DevTools → Network and filter `registrations`.
6. Add the course. Show the POST request and successful status without opening
   cookies or Authorization headers.
7. Open **My schedule** and show the new timetable item.

### Minute 4–6: Database proof

1. Switch to local Supabase Studio.
2. Show `courses` and `course_sections`; explain that the source CSV is normalized
   into term, course, and section tables.
3. Show `registrations` and locate the Student's new row.
4. Show the updated `enrolled_count` in `course_sections`.
5. Show the new `audit_logs` entry.
6. Show `Authentication → Users` and then `user_roles`; explain that identity and
   authorization are separate.

### Minute 6–8: Code from frontend to backend

Open these files in VS Code in this order:

1. `src/app/page.tsx`: public entry point and role preview links.
2. `src/components/role-dashboard.tsx`: shared responsive workspace; search state,
   course drawer, and the `fetch('/api/registrations')` call.
3. `src/app/api/registrations/route.ts`: Zod validates a UUID, the session is checked,
   Student role is required, and an RPC is called.
4. `src/lib/auth.ts`: protected server routes resolve identity and role.
5. `src/lib/course-catalog.ts`: reads normalized Supabase rows and maps them for the UI.
6. `scripts/import-course-catalog.mjs`: validates CSV rows and performs safe upserts.
7. `supabase/migrations/0001_initial_schema.sql`: tables, indexes, RLS policies, and
   locked transaction functions.

Do not scroll through every line. Use VS Code search to jump to the named function,
then explain its responsibility in one sentence.

### Minute 8–9: RBAC roles

Open the Faculty, Registrar, and Administrator previews. For each one, show the role
label and one unique capability:

- Faculty: assigned classes and rosters.
- Registrar: offerings, capacity, registration operations, and reports.
- Administrator: users/roles, system health, and audit trail.

Clarify that preview routes demonstrate the interface, while `/student`, `/faculty`,
`/registrar`, and `/admin` are protected by server-side checks.

### Minute 9–11: Testing

1. Open Selenium IDE, load the `.side` file, and run the suite. Show the green result.
2. Explain one positive navigation test, one search test, one access-control test, and
   one responsive test.
3. Open JMeter, show 20 users, 10-second ramp-up and 5 loops.
4. Run it or show the saved Aggregate Report. State the number of samples, average
   response time, throughput, and error rate from the displayed run.

### Minute 11–12: Conclusion

Say:

> The result is a reproducible local full-stack prototype: the UI is role-aware, the
> catalogue is data-driven, registration is handled atomically in PostgreSQL, and
> authorization is enforced both on the server and through RLS. Production rollout
> would add the university SAML configuration, SIS integration, hosted payment
> provider, monitoring, and a managed Supabase/Vercel environment.

## 4. What “local database” means

A local database is a database server running on the same computer rather than on a
remote cloud account. Docker runs PostgreSQL and the Supabase services in containers.
The data persists in a Docker volume. `supabase/migrations` defines the structure,
`supabase/seed.sql` provides safe starter data, and the CSV importer supplies catalogue
records. Supabase Studio is only a visual management interface; PostgreSQL is the
actual database.

## 5. Frontend-to-backend explanation

```text
User clicks Add
  → React sends POST /api/registrations with one section UUID
  → Zod validates the body
  → Supabase Auth identifies the session
  → user_roles confirms Student access
  → register_for_section locks the section row
  → PostgreSQL checks rules and writes registration + audit data atomically
  → JSON result returns
  → React updates the schedule and shows a toast
```

“Atomically” means all related changes succeed together or are rolled back together.
The row lock prevents two simultaneous users from both taking one final seat.

## 6. Honest implemented scope and limitations

Implemented end to end:

- local email/password demonstration accounts;
- trusted roles, server route checks, and RLS policies;
- CSV validation/import into normalized tables;
- database-backed catalogue and role metrics;
- live Student add/drop API and audit records;
- responsive role workspaces;
- Selenium and JMeter test definitions.

Prototype or future integration:

- university SAML metadata is not available in the local demonstration;
- SIS synchronization needs institutional APIs and credentials;
- payments are represented in the data/UI but no real card processor is connected;
- some Registrar/Admin buttons demonstrate workflows rather than changing production data;
- structured meeting records are needed for complete timetable conflict calculation;
- formal prerequisite enforcement should be completed and regression-tested before launch.

Stating these limitations is good engineering: it distinguishes a working academic
prototype from a production university system.

## 7. Likely viva questions and concise answers

### Why Next.js?

It provides React UI, server-rendered protected pages, and route handlers in one
TypeScript project. This reduces duplicated client/server models for a student-scale
full-stack application.

### Why Supabase if the database is local?

Supabase supplies PostgreSQL, authentication, an API gateway, Studio, migrations, and
RLS. The local CLI provides the same development model without requiring cloud deployment.

### What is RBAC?

Role-Based Access Control grants capabilities according to a trusted assigned role.
Orbit supports Student, Faculty, Registrar, and System Administrator. The role is
stored in `user_roles`, checked in server code, and used by RLS policies.

### Authentication versus authorization?

Authentication answers “who is this user?” Authorization answers “what may this user
do?” Supabase Auth handles identity; `user_roles`, protected routes, and RLS handle permissions.

### Why not store roles in editable user metadata?

Editable metadata could let a user claim a stronger role. A protected database table
maintained by authorised processes is a safer source of truth.

### What is RLS?

Row Level Security is a PostgreSQL feature that evaluates a policy for each database
operation. For example, a Student can read their own registrations but not another
Student's rows.

### Why a database function for registration?

Registration changes multiple related records and must handle concurrency. A single
transaction function can lock the section, evaluate rules, update counts, create the
registration or waitlist row, and append an audit record consistently.

### How is hard-coded catalogue data avoided?

`data/course_catalog.csv` is validated by a Node.js importer and upserted into
`terms`, `courses`, and `course_sections`. Live views query those tables.

### What is an API?

An API is a controlled interface between components. Here, `/api/registrations`
accepts POST/DELETE requests, validates the input and user, and calls the database
function. The browser does not receive a database secret.

### What did Selenium test?

The supplied suite tests landing-page rendering, role previews, catalogue search,
course details, preview schedule update, role-specific workspaces, protected-route
redirection, and responsive navigation.

### What did JMeter measure?

It sent repeated HTTP requests using concurrent virtual users and measured response
time, percentiles, throughput, and errors. Results describe this Mac and local
development configuration, not a production service-level guarantee.

### How would this be deployed later?

Push the source to GitHub, create a managed Supabase project, apply migrations, add
university SAML settings, configure Vercel environment variables and callback URLs,
then deploy the Next.js app to Vercel. Cloudflare may manage DNS but is not required
for the local submission.

