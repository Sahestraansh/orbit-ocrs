# OCRS implementation guidance

## Product baseline

Build the Online Course Registration System described in the project documents. Preserve traceability to SRS requirements REQ-1 through REQ-17 and follow the Incremental Model.

## Stack

- Next.js App Router with strict TypeScript.
- Supabase PostgreSQL and Supabase Auth with university SAML SSO.
- PostgreSQL Row Level Security for authorization.
- Vercel for previews and production.
- Cloudflare may manage DNS and optional edge controls; it is not the application host.

## Security and RBAC

- Roles are `student`, `faculty`, `registrar`, and `system_admin`.
- Resolve roles only after authentication from `public.user_roles`.
- Never treat hidden navigation, route names, or editable metadata as authorization.
- Check permissions in server code and RLS for every protected operation.
- Never expose the Supabase service-role key to the browser.
- Keep audit and provider-event records append-only to application roles.
- Never store raw payment-card data.

## Database work

- Use versioned Supabase migrations and preserve rollback/disablement options.
- Add constraints, indexes, grants, and RLS policies with every table.
- Registration changes need concurrency tests for the last available seat.
- Webhook and SIS synchronization handlers must be idempotent.
- Store timestamps in UTC and format them in the configured university time zone.

## Interface quality

- Reuse the design tokens in `src/app/globals.css`.
- Maintain semantic HTML, visible focus, keyboard access, AA contrast, and non-colour status labels.
- Preserve input after recoverable errors and confirm consequential actions.
- Support loading, empty, success, warning, error, forbidden, and dependency-failure states.
- Keep role workspaces focused on the tasks described in the product documents.

## Quality gates

- Before merge: typecheck, build, database tests, relevant integration tests, and accessibility checks.
- Authorization changes require positive and negative role tests.
- Registration changes require concurrency and rollback tests.
- Payment changes require invalid-signature, replay, delayed-event, and amount-mismatch tests.
- Do not weaken validation, RLS, audit coverage, or tests merely to make a change pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
