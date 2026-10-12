# Orbit — Online Course Registration System

Orbit is a role-based course registration web application. It was built with Next.js, TypeScript, PostgreSQL, and a local Supabase instance.

## Features

- Student, Faculty, Registrar, and Administrator workspaces
- Course search and course-details panel
- Add/drop registration flow and student schedule
- Role-based access control
- PostgreSQL database with Supabase Auth and Row Level Security
- Course data imported from a CSV file

## Run the project

### 1. Install requirements

- Node.js 20 or newer
- Docker Desktop running
- Supabase CLI installed

Install the JavaScript packages:

```bash
npm install
```

### 2. Start the local database

```bash
npm run db:start
```

Copy `.env.local.example` to `.env.local`. Run `npm run db:status` and paste the Publishable Key and Secret Key printed by that command into `.env.local`.

Apply the database schema and import the course data:

```bash
npx supabase migration up
npm run db:import-csv
```

### 3. Start the website

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The local Supabase dashboard is at [http://127.0.0.1:54323](http://127.0.0.1:54323).

## Project structure

| Location | Purpose |
| --- | --- |
| `src/app` | Pages, API route, login, and role workspaces |
| `src/components` | Shared React user-interface components |
| `src/lib` | Authentication, permissions, Supabase clients, and data helpers |
| `supabase/migrations` | PostgreSQL tables, policies, and database functions |
| `data/course_catalog.csv` | Course and section data used by the importer |
| `scripts/import-course-catalog.mjs` | Validates and imports CSV rows into PostgreSQL |
| `testing` | Selenium IDE and JMeter test files |

## Useful commands

```bash
npm run dev                 # start the website
npm run db:start            # start local Supabase services
npm run db:stop             # stop local Supabase services
npm run db:status           # display local Supabase URLs and keys
npm run db:import-csv       # import data/course_catalog.csv
npm run typecheck           # check TypeScript
npm run build               # create a production build
```

## Database

The main tables are `profiles`, `user_roles`, `terms`, `courses`, `course_sections`, `registrations`, and `audit_logs`. The registration API uses database functions to handle add/drop requests safely. Course information is not hard coded in the interface; it comes from `data/course_catalog.csv` and is stored in PostgreSQL.
