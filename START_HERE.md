# Start here

This is the clean, submission-ready copy of the Orbit Online Course Registration
System. Generated build folders, installed packages, local database internals, and
private environment values are excluded from Git.

## First-time setup on this Mac

1. Open Docker Desktop and wait until it says the engine is running.
2. Open this folder in VS Code:

   ```text
   /Users/sahestraanshtyagi/Desktop/Orbit-OCRS-Final-Submission
   ```

3. Open **Terminal → New Terminal** in VS Code.
4. Install the packages:

   ```bash
   npm install
   ```

5. Start the local Supabase database:

   ```bash
   npm run db:start
   ```

6. If `.env.local` does not already exist, duplicate `.env.local.example`, name the
   copy `.env.local`, run `npm run db:status`, and paste the local Publishable and
   Secret keys into their matching placeholders. Never commit or screenshot this
   file.
7. Import the validated CSV catalogue:

   ```bash
   npm run db:import-csv
   ```

8. Open a second VS Code terminal and start the website:

   ```bash
   npm run dev
   ```

9. Open these addresses:

   - Website: `http://localhost:3000`
   - Local Supabase Studio: `http://127.0.0.1:54323`

## Every later demonstration

```text
Open Docker Desktop
      ↓
npm run db:start
      ↓
npm run db:import-csv
      ↓
npm run dev (second terminal)
      ↓
Open localhost:3000 and 127.0.0.1:54323
```

## Before GitHub submission

Run:

```bash
npm run lint
npm run typecheck
npm run build
```

Then follow `GITHUB_SUBMISSION_GUIDE.md`. Do not add `.env.local`, `.next`,
`node_modules`, Supabase temporary folders, test result files, or screenshots that
show secret keys.

## Documentation map

- `README.md` — project overview and setup.
- `ARCHITECTURE.md` — frontend, backend, database, API, and RBAC explanation.
- `LOCAL_DEMO_GUIDE.md` — complete local demonstration walkthrough.
- `docs/PROJECT_REPORT_DRAFT.md` — report content ready for the later Word document.
- `docs/DIAGRAMS.md` — system design diagrams in Mermaid source.
- `docs/SCREENSHOT_CHECKLIST.md` — exact screenshots still required from the student.
- `docs/DEMO_AND_VIVA_GUIDE.md` — presentation order and likely viva questions.
- `testing/` — Selenium IDE and JMeter assets.
