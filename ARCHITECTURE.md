# Orbit architecture and demonstration guide

## 1. Product overview

Orbit is an Online Course Registration System for four university roles:

| Role | Main capabilities |
| --- | --- |
| Student | Search the catalog, inspect seats and requirements, register/drop, join a waitlist, view schedule and payments |
| Faculty | View assigned sections, class schedules, and permitted student rosters |
| Registrar | Publish offerings, control registration windows, review exceptions, monitor capacity, and export reports |
| System administrator | Assign roles, inspect service health, and review the audit trail |

The public landing page has one university SSO action. The user never chooses a trusted role. After Supabase authenticates the university identity, the server reads `public.user_roles` and sends the user to the assigned workspace.

## 2. Application layers

```text
Browser
  └─ Next.js pages and RoleDashboard interactions
       ├─ Server Components: identity and role checks
       ├─ Route Handlers: validated registration requests
       └─ Supabase SSR client: secure cookie session
            ├─ Supabase Auth: university SAML SSO
            └─ PostgreSQL
                 ├─ Tables and constraints
                 ├─ Row Level Security policies
                 ├─ register_for_section()
                 ├─ drop_registration()
                 └─ append-only audit records

Deployment
  ├─ Vercel: Next.js application
  ├─ Supabase: Auth and PostgreSQL
  └─ Cloudflare: optional DNS/edge layer
```

## 3. Frontend components

### Landing page

File: `src/app/page.tsx`

- Introduces the registration experience.
- Shows a visual weekly schedule.
- Provides the single university SSO action.
- Provides clearly labelled interactive previews for all roles.
- Displays setup/authentication feedback without revealing implementation details.

### Shared role workspace

File: `src/components/role-dashboard.tsx`

This is the main application surface. It contains:

- Responsive sidebar and mobile navigation.
- Role-specific navigation.
- Dashboard metrics, notices, tables, charts, empty states, status labels, and toasts.
- Student catalog search and course drawer.
- Student add/drop/waitlist interaction.
- Student weekly timetable and payment view.
- Faculty assigned-class and roster views.
- Registrar offering, exception, capacity, and report views.
- Administrator access, health, and audit views.
- Page-scoped WebMCP tools for catalog search and registration updates.

### Styling and design system

File: `src/app/globals.css`

- Gentle teal, mint, gold, blue, and rose palette.
- Shared typography, spacing, borders, radii, shadows, controls, cards, and status tokens.
- Desktop, tablet, and mobile breakpoints.
- Visible focus states and reduced-motion support.
- No essential state is communicated by colour alone.

### Protected routes

| Route | Role check |
| --- | --- |
| `/student` | `student` |
| `/faculty` | `faculty` |
| `/registrar` | `registrar` |
| `/admin` | `system_admin` |
| `/dashboard` | Resolves the assigned role and redirects |
| `/demo/[role]` | Sample-data preview; never treated as authenticated access |

The protected route files call `requireRole()` on the server. A wrong role is sent to `/forbidden`; an authenticated account without a role is sent to `/access-pending`.

## 4. Backend components

### Authentication and session refresh

- `src/app/auth/actions.ts`: starts university SAML SSO and signs out.
- `src/app/auth/callback/route.ts`: exchanges the provider callback code for a Supabase session.
- `src/proxy.ts`: refreshes Supabase cookies safely on requests.
- `src/lib/auth.ts`: fetches the authenticated user and trusted role.
- `src/lib/supabase/server.ts`: server-side Supabase client.
- `src/lib/supabase/browser.ts`: browser client for future realtime/client features.

### Registration API

File: `src/app/api/registrations/route.ts`

1. Validates the request body with Zod.
2. Verifies the Supabase session.
3. Confirms the user has the Student role.
4. Calls a transactional PostgreSQL function.
5. Returns a concise success response or a safe conflict/error response.

The browser does not insert directly into `registrations`. This keeps concurrency and business rules inside one database transaction.

## 5. Database

Migration: `supabase/migrations/0001_initial_schema.sql`

### Identity and access

- `profiles`: university-facing user information.
- `user_roles`: one trusted application role per user.

### Academic catalog

- `terms`: semester dates and registration/drop windows.
- `courses`: reusable catalog records.
- `course_prerequisites`: course-to-course requirements.
- `course_sections`: a course offered in one term.
- `section_meetings`: exact weekday/time intervals used for conflict checks.

### Student records

- `academic_history`: completed courses and pass status.
- `student_holds`: blocks registration when required.
- `registrations`: registered, dropped, waitlisted, or withdrawn status.
- `waitlist_entries`: queue position and offer timing.
- `registration_overrides`: reviewed exceptions for capacity, prerequisites, conflicts, or credit limits.

### Operations

- `payment_transactions`: provider reference, amount, and status; no raw card data.
- `notifications`: user notices and read state.
- `audit_logs`: append-only administrative/security events.
- `integration_events`: idempotency ledger for SIS/payment/webhook events.

### Transaction functions

`register_for_section(section_id)`:

1. Verifies the authenticated Student role.
2. Locks the requested section row.
3. Validates the active registration window.
4. Checks unresolved holds.
5. Calculates the credit limit.
6. Detects overlapping meeting times.
7. Registers the student when a seat is available, otherwise creates a waitlist entry.
8. Updates the counter and writes an audit record in the same transaction.

`drop_registration(section_id)`:

1. Locks the current registration.
2. Marks it dropped.
3. Removes any waitlist entry.
4. Releases a seat when applicable.
5. Writes an audit record.

### RLS summary

- Students see their own profile, history, holds, registrations, waitlist, payments, and notifications.
- Faculty see registrations only for their assigned sections.
- Registrars manage academic catalog and registration operations.
- System administrators manage role assignments and read security/audit information.
- Anonymous users cannot query application tables.
- Route protection is defence in depth; RLS remains the final database boundary.

## 6. How to demonstrate the complete system

### Frontend demonstration

1. Open `http://localhost:3000`.
2. Explain that the single SSO button is the production entry point.
3. Open the Student preview.
4. Show Overview, Course catalog, My schedule, Waitlist, and Payments.
5. Search for `database`, open CSE301, and add/drop it. Point out requirement and conflict checks.
6. Return home and show Faculty, Registrar, and Administrator previews.
7. Resize the browser to demonstrate responsive navigation and readable mobile layouts.

### Database demonstration in Supabase

1. Open the Supabase project dashboard.
2. Open **Table Editor** and show `profiles`, `user_roles`, `courses`, `course_sections`, `registrations`, `waitlist_entries`, and `audit_logs`.
3. Open **Database → Functions** and show `register_for_section` and `drop_registration`.
4. Open **Authentication → Users** to show that identity records are separate from application roles.
5. Open **Database → Policies** and show that RLS is enabled on every application table.
6. In the SQL editor, use safe read-only examples:

   ```sql
   select c.code, c.title, s.section_code, s.capacity, s.enrolled_count
   from public.course_sections s
   join public.courses c on c.id = s.course_id
   order by c.code;

   select p.university_id, p.full_name, r.role
   from public.profiles p
   left join public.user_roles r on r.user_id = p.id
   order by p.full_name;

   select occurred_at, action, resource_type, resource_id, outcome
   from public.audit_logs
   order by occurred_at desc
   limit 25;
   ```

7. Demonstrate that a Student session cannot read another student's registrations. This is the clearest proof that RBAC is enforced in the database rather than only hidden in the UI.

### Backend request demonstration

In the browser's Developer Tools, open **Network**, perform an add/drop action, and inspect the request to `/api/registrations`:

- Request method is POST to add or DELETE to drop.
- Body contains only the section UUID.
- The server verifies the session and role.
- PostgreSQL performs the transaction and returns the result.
- No service-role key or sensitive database credential appears in browser code.

## 7. Local, Supabase, and Vercel lifecycle

```text
Local development
  npm run dev
       ↓
Supabase migration
  supabase link → supabase db push
       ↓
Environment variables
  Project URL + publishable key + site URL + SSO domain
       ↓
Vercel
  Import Git repository → add environment variables → deploy
       ↓
Identity configuration
  Add production /auth/callback to Supabase/SAML allowlists
       ↓
Optional Cloudflare DNS
  Use Vercel-provided targets; validate SSO and webhooks before proxying
```

## 8. Production completion checklist

- Obtain Supabase and university SAML configuration.
- Connect the university SIS API and define its synchronization schedule.
- Select a PCI-compliant hosted payment provider and verify signed webhooks.
- Add integration retries and monitoring.
- Execute RLS allow/deny tests for every role.
- Load and concurrency test last-seat registration.
- Complete accessibility testing with keyboard, screen reader, 200% zoom, and mobile devices.
- Configure backups, retention, alerts, support ownership, and incident runbooks.
