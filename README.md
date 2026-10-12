# Orbit — Online Course Registration System

Orbit is a responsive, role-based course registration application based on the OCRS SRS, PRD, TRD, UI/UX scheme, database design, and implementation plan in this project.

For the shortest setup path, begin with [`START_HERE.md`](./START_HERE.md). For the complete offline/local setup and presentation walkthrough, read [`LOCAL_DEMO_GUIDE.md`](./LOCAL_DEMO_GUIDE.md). The local setup uses PostgreSQL, Auth, APIs, and Supabase Studio on this Mac without deploying to Supabase or Vercel.

Final-submission support is included in [`docs/`](./docs): a report draft, editable
design diagrams, an exact screenshot checklist, and a demo/viva guide. Repeatable
Selenium IDE and JMeter plans are included in [`testing/`](./testing).

## Included

- Public landing page with one university SSO action.
- Server-side role resolution for Student, Faculty, Registrar, and System Administrator workspaces.
- Interactive previews for all four roles without requiring credentials.
- Student catalog search, course detail checks, add/drop flow, schedule, waitlist, and payments views.
- Faculty classes, rosters, and schedule views.
- Registrar enrollment operations, capacity monitoring, offerings, exceptions, and reports.
- Administrator users/roles, service health, and append-only audit views.
- Supabase PostgreSQL schema, RLS policies, registration transactions, waitlisting, and seed data.
- Vercel-ready Next.js application with security headers and responsive, accessible styling.

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`.

3. Start the app:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`. All role previews work before Supabase is connected.

## Run the full backend locally

Install and open Docker Desktop, then use two terminals:

```bash
npm run db:start
```

Copy `.env.local.example` to `.env.local`, paste the Publishable and Secret keys from `npm run db:status`, then start the website:

```bash
npx supabase migration up
npm run db:import-csv
npm run dev
```

Open the website at `http://localhost:3000` and local Supabase Studio at `http://127.0.0.1:54323`.

## CSV-backed course catalogue

Course and section details are maintained in [`data/course_catalog.csv`](./data/course_catalog.csv), not in a React or SQL hard-coded array. The importer validates the file and maps each row into the normalized `terms`, `courses`, and `course_sections` tables.

```bash
npm run db:import-csv -- --dry-run
npm run db:import-csv
```

The live Student, Faculty, and Registrar catalogue views query these Supabase records. See [`data/README.md`](./data/README.md) for the columns and safe re-import behaviour.

## Optional remote Supabase setup

1. Create a Supabase project.
2. Install and authenticate the Supabase CLI.
3. Link this directory to the project and apply the migration:

   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

4. For a non-production project, load `supabase/seed.sql` through the SQL editor or your preferred seed workflow.
5. Add the Project URL and publishable/anonymous key to `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   UNIVERSITY_SSO_DOMAIN=university.edu
   ```

6. In Supabase Authentication, configure the university SAML provider and add these redirect URLs:

   - `http://localhost:3000/auth/callback`
   - `https://YOUR_VERCEL_DOMAIN/auth/callback`

7. Create or sign in a test user, then assign exactly one trusted role. Replace the UUID and role as needed:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('AUTH_USER_UUID', 'student')
   on conflict (user_id) do update set role = excluded.role;
   ```

Role assignments live in `public.user_roles`, are not derived from editable user metadata, and are enforced through PostgreSQL Row Level Security.

## Deploy to Vercel

1. Push this directory to a Git repository.
2. Import it into Vercel as a Next.js project.
3. Add the four environment variables shown in `.env.example` for Preview and Production.
4. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
5. Deploy, then add the production `/auth/callback` URL to the Supabase redirect allowlist and SAML configuration.
6. If Cloudflare manages DNS, begin with DNS-only records and use the exact targets Vercel provides for the domain. Enable proxying only after SSO callbacks, caching, security headers, and webhooks have been tested end to end.

## Authorization model

- The landing page is public and never trusts a selected role.
- Supabase authenticates the user through university SSO.
- `/dashboard` reads `public.user_roles` and routes the user to the assigned workspace.
- Each protected page checks the expected role on the server.
- RLS policies protect every exposed table.
- Registration and drop operations execute through locked database functions to avoid last-seat races.
- The service-role key is not used by the browser application.

## Verification

Run these checks before each release:

```bash
npm run typecheck
npm run build
```

For production readiness, also test concurrent last-seat registration, SAML callback failures, role-denial cases, payment webhook signatures/replays, keyboard-only navigation, 200% zoom, and mobile layouts.

## Important production integrations

The repository includes the interfaces and security model, but the following institution-specific values must be supplied before live launch:

- Supabase project credentials and SAML metadata.
- University SIS API endpoint and credentials.
- PCI-compliant hosted payment provider and webhook secret.
- Verified Vercel domain and Cloudflare DNS targets.
- Institutional data-retention, privacy, and support contacts.

Never store raw payment-card data, SAML assertions, access tokens, or production student records in logs or source control.
