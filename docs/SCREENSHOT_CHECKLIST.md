# Screenshot and evidence checklist

Create this folder outside the Git repository if the images contain student data:

```text
Orbit-OCRS-Report-Evidence/
```

Save PNG files with the exact names below. Crop only empty desktop space; keep the
application title, URL, key result, and relevant labels visible. Use the final clean
project folder for every screenshot.

## A. Working-system output screenshots

### W01 — Landing page

1. Start Docker, Supabase, CSV import, and the website.
2. Open `http://localhost:3000` in Brave.
3. Set zoom to 100% and close unrelated tabs.
4. Capture the hero, **Sign in to the local system**, schedule preview, and part of
   the role cards.
5. Save as `W01-landing-page.png`.

Caption: **Orbit OCRS landing page providing a single authenticated entry point and role previews.**

### W02 — Student overview

1. Open Student preview or sign in as a local Student.
2. Keep the left navigation, role label, overview metrics, and notice panel visible.
3. Save as `W02-student-overview.png`.

Caption: **Student workspace showing role-specific navigation and term summary.**

### W03 — CSV-backed course catalogue

1. Select **Course catalog**.
2. Search for `MGT305` or `CSE301`.
3. Keep the search term and matching database record visible.
4. Save as `W03-course-catalog-search.png`.

Caption: **Course catalogue filtered using records imported from the CSV into Supabase.**

### W04 — Course details and registration checks

1. Select the matching course.
2. Keep course code, capacity, available seats, registration checks, and action button visible.
3. Save as `W04-course-details.png`.

Caption: **Course detail drawer with capacity, prerequisite, conflict, and credit-limit checks.**

### W05 — Live Student schedule

1. Use a real local Student account, not preview mode.
2. Add one course successfully.
3. Select **My schedule**.
4. Capture the newly added course and summary counts.
5. Save as `W05-live-student-schedule.png`.

Caption: **Student timetable updated after a database-backed registration transaction.**

### W06–W08 — Other RBAC workspaces

- `W06-faculty-workspace.png`: Faculty overview with **Dr. Arjun Menon** and assigned classes.
- `W07-registrar-workspace.png`: Registrar control centre with enrollment/capacity metrics.
- `W08-admin-workspace.png`: Administrator overview with system health and access summary.

Captions should identify the role and explain that the navigation changes according
to the role. Preview pages demonstrate presentation; actual protected pages enforce
roles on the server and in database policies.

### W09 — Responsive view

1. In Brave DevTools, toggle the device toolbar.
2. Select an iPhone-sized viewport.
3. Open the mobile navigation.
4. Save as `W09-responsive-mobile.png`.

Caption: **Responsive Student workspace with accessible mobile navigation.**

## B. Backend and database screenshots

Open `http://127.0.0.1:54323` only after `npm run db:start` is running.

### B01 — CSV file in VS Code

1. Open `data/course_catalog.csv` in VS Code.
2. Show the header plus several records, including course code, instructor, capacity,
   room, schedule, and term dates.
3. Hide the terminal if it contains keys.
4. Save as `B01-course-catalog-csv.png`.

### B02 — Courses table

1. In Supabase Studio, open **Table Editor → courses**.
2. Show code, title, department, level, and credits.
3. Save as `B02-supabase-courses.png`.

### B03 — Sections table

1. Open **course_sections**.
2. Show section code, capacity, enrolled count, instructor name, room, and meeting pattern.
3. Save as `B03-supabase-sections.png`.

### B04/B05 — Registration before and after

1. Open **registrations** and capture the state before a new registration as
   `B04-registrations-before.png`.
2. Add a course from the live Student workspace.
3. Refresh the table and show the inserted/updated registered row.
4. Save as `B05-registrations-after.png`.

### B06 — Audit log

1. Open **audit_logs**.
2. Sort by `occurred_at` descending.
3. Show the recent registration action and outcome.
4. Save as `B06-audit-log.png`.

### B07 — Roles and identity separation

1. Capture **Authentication → Users** without exposing passwords or tokens.
2. Capture **Table Editor → user_roles**.
3. If one image is unreadable, use two files:
   `B07a-auth-users.png` and `B07b-user-roles.png`.

Caption: **Supabase Auth stores identity while the `user_roles` table stores the trusted application role.**

### B08 — Database functions / SQL

1. In VS Code, open `supabase/migrations/0001_initial_schema.sql`.
2. Search for `create or replace function public.register_for_section`.
3. Keep the function name and several validation steps visible.
4. Save as `B08-registration-function.png`.

### B09 — API request

1. In Brave, open DevTools with `Option + Command + I`.
2. Select **Network** and filter for `registrations`.
3. Add or drop a course.
4. Select `/api/registrations` and show the method, status code, and JSON response.
5. Do not show cookies, Authorization headers, or secret values.
6. Save as `B09-registration-api.png`.

## C. Minimum three software-tool screenshots

Use at least three; five are prepared below.

### T01 — VS Code (implementation)

Open `src/app/api/registrations/route.ts` with the Explorer visible and save
`T01-vscode-registration-api.png`.

Caption: **Visual Studio Code used to implement the Next.js registration API with validation, authentication, and role checking.**

### T02 — Supabase Studio (database)

Use `B03-supabase-sections.png` again only if the faculty permits repeated figures;
otherwise capture `T02-supabase-studio.png` with the table list and one table visible.

Caption: **Supabase Studio used to inspect the local PostgreSQL schema and imported records.**

### T03 — Selenium IDE (functional testing)

1. Open `testing/selenium/orbit-ocrs-functional-tests.side` in Selenium IDE.
2. Run the full suite.
3. Wait until all tests finish.
4. Show the test list, green run result, run/failure counts, and log.
5. Save as `T03-selenium-suite-passed.png`.

If any test fails, do not take the final screenshot. Save the log, fix/retest, and
only report the executed result.

### T04 — JMeter Thread Group (test configuration)

1. Open `testing/jmeter/orbit-ocrs-load-test.jmx`.
2. Select **Student Catalogue Load - 20 Users**.
3. Show 20 users, 10-second ramp-up, and loop count 5.
4. Save as `T04-jmeter-thread-group.png`.

### T05 — JMeter Aggregate Report (performance result)

1. Clear old results with **Run → Clear All**.
2. Run the test while the website is active.
3. Select **Aggregate Report**.
4. Widen columns so Label, Samples, Average, Min, Max, Error %, Throughput, and
   90th/95th/99th percentiles are readable.
5. Save as `T05-jmeter-aggregate-report.png`.

Expected shape for the supplied plan: 100 samples for each of three labels and 300
total samples. Exact timing will differ between runs.

### T06 — Git/GitHub (version control)

After publishing, capture the public repository home with its files and README as
`T06-github-repository.png`.

## D. Submission-link evidence

### L01 — Demo video access

1. Upload the final MP4 to Google Drive.
2. Select **Share → General access → Anyone with the link → Viewer**.
3. Copy the link.
4. Open a private/incognito window where no Google account is signed in.
5. Paste the link and confirm the video can play.
6. Save as `L01-drive-video-incognito.png`.

### L02 — GitHub access

Open the GitHub repository in the same private/incognito window and save
`L02-github-incognito.png`.

## Final evidence count

Recommended: 18–22 screenshots. The Word report should use the clearest 12–16 figures;
the remaining images are verification evidence or appendix material.

