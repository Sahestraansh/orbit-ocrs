# Course catalogue CSV

`course_catalog.csv` is the editable source for local course and section data. Each row represents one section offered in one academic term.

The importer validates all columns before writing anything. It maps the CSV into three normalized Supabase tables:

- Term columns → `terms`
- Course columns → `courses`
- Section and instructor columns → `course_sections`

Validate without changing the database:

```bash
npm run db:import-csv -- --dry-run
```

Apply pending migrations and import the catalogue:

```bash
npx supabase migration up
npm run db:import-csv
```

Existing section enrollment counts are preserved on later imports so registrations are not accidentally overwritten. To intentionally restore the counts stored in the CSV, run:

```bash
npm run db:import-csv -- --replace-enrollment
```

The importer is restricted to a localhost Supabase URL. An instructor email is linked to `profiles.id` when that local faculty account already exists. Otherwise, the imported instructor name remains visible and the link is established the next time the importer runs after the account is created.
