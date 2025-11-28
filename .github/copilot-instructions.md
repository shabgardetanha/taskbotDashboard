<!-- .github/copilot-instructions.md - guidance for AI coding agents working on TaskBot Dashboard -->

# Quick Context

- This is a Next.js (App Router) project (Next 14) using TypeScript, Tailwind and the `app/` directory.
- Persian (Farsi) RTL UI: root `app/layout.tsx` sets `lang="fa"` and `dir="rtl"`.
- Supabase is the primary backend (db + auth + realtime). A Telegram bot (Telegraf) integrates via a server webhook.

# Key Files & Patterns (browse these first)

- `src/app/api/telegram/route.ts` — Telegram webhook + Telegraf handlers. Server-only code; expects `TELEGRAM_BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY`.
- `src/lib/supabase.ts` — client init: uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It intentionally falls back to placeholders to avoid build-time crashes.
- `src/app/webapp/*` and `src/app/dashboard/*` — web UI areas (kanban uses `@dnd-kit/*`).
- `src/components/ui/*` — reusable UI primitives (button, card, input, progress, badge).
- `supabase/migrations/*` and `Note.md` — DB schema and migration guidance (policies, indexes, RLS). Read `Note.md` for project-specific migration and supabase CLI commands.

# Environment & Secrets

- Required env vars (server/runtime):
  - `TELEGRAM_BOT_TOKEN` (server only)
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)
  - `NEXT_PUBLIC_SUPABASE_URL` (client+server)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client)
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `TELEGRAM_BOT_TOKEN` to client code or commits.

# Running & Developer Workflows

- Dev server: `npm run dev` (Next default on port 3000).
- Build: `npm run build` then `npm run start` for production locally.
- Lint: `npm run lint` (uses `eslint-config-next`).
- Supabase CLI (from `Note.md`):
  - `supabase login`
  - `supabase link --project-ref <ref>` (project-ref in `Note.md`)
  - `supabase db push` to apply migrations located under `supabase/migrations`.
- Telegram webhook testing: the repo includes a curl sample in `Note.md` that posts a fake update to `/api/telegram` — use that when testing handlers locally (or use ngrok/forwarding when testing with a real bot).

# Codebase Conventions & Patterns

- Server vs Client:
  - Code under `src/app/api/*` and any files that import server-only env vars should be treated as server-only.
  - `src/lib/supabase.ts` is safe to import on both sides because it uses placeholder defaults to avoid build-time crashes. Prefer creating a server-only supabase client using service role key for migrations and admin actions in API routes.
- Telegram handlers:
  - Handlers use `Telegraf` and register commands via `bot.command(...)` and `bot.start(...)`.
  - The webhook endpoint calls `bot.handleUpdate(body)` inside the exported `POST` function.
  - Commands often call `getOrCreateUser` which reads/writes the `profiles` table; follow the same pattern when adding new commands.
- Database & RLS:
  - `Note.md` contains SQL that enables RLS and creates policies; migrations reflect assumptions about `profiles` and `tasks` tables and `assignee_id` usage.
  - Tasks are authored with `assignee_id` referencing `profiles.id` (UUID). When writing server-side updates, check `assignee_id` for ownership.
- UI & localization:
  - The app uses RTL layout and Farsi strings in the repo — keep text direction and localization in mind when creating UI components.

# Small Examples (copy/paste patterns)

- Telegram command to add task (follow `route.ts` style):
  - `bot.command('new', async (ctx) => { /* parse ctx.message.text, use server supabase client, reply with confirmation */ })`
- Webhook handler skeleton (already used in repo):
  - `export async function POST(req: NextRequest) { const body = await req.json(); await bot.handleUpdate(body); return new Response('OK') }`

# Where to Look When You Get Stuck

- If a server route fails: check env vars and `Note.md` for supabase project ref + migration status.
- For DB schema questions: inspect `supabase/migrations/*.sql` and `Note.md` migration snippet.
- For UI component styling: review `src/components/ui/*` (they use Tailwind + `class-variance-authority`).

# Safety & Commit Guidance

- Never commit env secrets. If you need to test with real tokens, use local `.env` and CI secrets.
- Tests are not present — prefer manual verification flows: run the dev server, trigger webhook via curl or a Telegram test bot, and verify DB rows in Supabase.

# Short Checklist for PRs from an AI agent

- Include which files changed and a short rationale (feature, bugfix, refactor).
- If you add a new server env var, add a one-line note in `Note.md` with how to set it and whether it's `NEXT_PUBLIC_`.
- For DB changes, update `supabase/migrations` with a timestamped SQL file and note RLS implications.

# New Features (Phases 1-4 Implementation)

## Phase 1: Extended Task System
- New fields: `due_date`, `due_time`, `description`, `parent_task_id`, `subtask_count`/`subtask_completed`
- New tables: `task_labels`, `task_label_links`, `subtasks`
- New components: `TaskDetailModal.tsx`, `TaskFilters.tsx`
- New API: `/api/tasks/{id}` (GET/PUT/DELETE), `/api/tasks/search`, `/api/subtasks`, `/api/labels`
- Migration: `20251128_phase1_extended_tasks.sql`

## Phase 2: Workspaces & Collaboration
- New tables: `workspaces`, `workspace_members`, `boards`, `board_columns`, `activity_logs`
- Role-based access (owner, admin, member, viewer) with RLS policies
- Audit trail: tracks all task changes with user attribution
- New API: `/api/workspaces`
- Migration: `20251129_phase2_workspaces_rbac.sql`

## Phase 3: Templates & Recurring Tasks
- New tables: `task_templates`, `recurring_task_instances`, `task_dependencies`, `task_time_logs`
- Recurring tasks with daily/weekly/monthly rules (uses `generate_recurring_task_instance()` function)
- Task templates for quick creation
- Migration: `20251130_phase3_templates_recurring.sql`

## Phase 4: Advanced Features
- Calendar view: `/dashboard/calendar/page.tsx` displays tasks by due_date
- Advanced search with filtering on priority, status, labels, date ranges
- Enhanced Telegram commands: `/overdue`, `/today` (in addition to existing `/new`, `/mytasks`, `/done`)

---

If anything here is unclear or you want more examples, tell me which area to expand.
