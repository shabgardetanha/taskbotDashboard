# Dashboard UI Issues - Root Cause & Fix

## Problem Summary
**Users were unable to see tasks displayed in the dashboard UI after creating them via the "Add Task" button or API.**

### Root Causes Identified

#### 1. **Missing RLS Policies on Base Tables**
The original `tasks` and `profiles` tables did not have Row-Level Security (RLS) policies defined. 

**Issue:**
- When RLS is enabled on a table in Supabase without defining policies, the default behavior is to **deny all access** (fail-closed security model)
- The frontend client code (using `NEXT_PUBLIC_SUPABASE_ANON_KEY`) couldn't read tasks because no SELECT policy existed
- The API server code (using `SUPABASE_SERVICE_ROLE_KEY`) couldn't write tasks because no INSERT policy existed

#### 2. **Incomplete Initial Schema Migration**
The project had Phases 1-3 migrations but was missing:
- Initial table creation (for `profiles` and base `tasks`)
- RLS policies for core tables
- Proper policy ordering to ensure safe access

---

## Solution Implemented

### New Migrations Created

#### File: `supabase/migrations/20251127_initial_schema.sql`
**Purpose:** Define base tables with safe RLS policies
- Creates `profiles` table (if not exists) - stores user info
- Creates `tasks` table (if not exists) - base task structure with new Phase 1 fields
- Enables RLS on both tables
- Creates RLS policies:
  - **profiles_public_read**: All users can view profiles
  - **profiles_user_update**: Users can only update their own profile
  - **tasks_public_read**: All users can view all tasks (disclosure model for collaborative UI)
  - **tasks_authenticated_create**: Authenticated users and service_role can create tasks
  - **tasks_user_update**: Users can update tasks assigned to them or service_role can update any
  - **tasks_user_delete**: Users can delete tasks assigned to them or service_role can delete any

#### File: `supabase/migrations/20251128_add_rls_policies.sql`
**Purpose:** Define RLS policies for Phase 1 extended tables
- Enables RLS on `task_labels`, `task_label_links`, `subtasks`
- Creates permissive policies that allow broad access (suitable for internal team app)
- Uses idempotent `DO` blocks with `IF NOT EXISTS` checks to prevent duplicate policy errors on re-runs

---

## Technical Details

### Why RLS Policies Were Missing
1. The original Supabase project likely had tables created manually or via UI
2. Phase 1-3 migrations only added **new columns and tables**, not base schema
3. No migration file existed to formalize the initial setup and RLS config

### Idempotent Design
The new migrations use PostgreSQL `DO` blocks with `IF NOT EXISTS` checks on `pg_policies`:
```sql
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE ... AND policyname = '...') THEN
    CREATE POLICY "..." ON table_name ...;
  END IF;
END
$$;
```
This prevents errors if migrations are re-run (e.g., during testing or in CI/CD).

### Policy Philosophy
- **Profiles:** Public read (to display user info in task UI), user-owned write
- **Tasks:** Public read (team can see all tasks), authenticated create/update/delete (with service_role override for API)
- **Labels, Subtasks:** Permissive access (internal team use case, not multi-tenant)

---

## Verification Steps

### 1. Apply Migrations to Supabase
```bash
supabase db push --yes
```

### 2. Verify Policies in Supabase Dashboard
Go to **SQL Editor** and run:
```sql
SELECT schemaname, tablename, policyname, QUAL
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Expected output should show policies for: `profiles`, `tasks`, `task_labels`, `task_label_links`, `subtasks`

### 3. Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","telegramId":12345}'
```

Expected response:
```json
{
  "id": 1,
  "title": "Test Task",
  "status": "todo",
  "priority": "medium",
  "assignee_id": "...",
  "created_at": "..."
}
```

### 4. Test Frontend Display
1. Open `/webapp` in browser
2. Add a new task
3. Task should appear immediately in the dashboard under "در انتظار" (To Do) column
4. Task should also appear in the realtime feed (due to Supabase channel subscription)

---

## Related Files Modified
- `supabase/migrations/20251127_initial_schema.sql` (new)
- `supabase/migrations/20251128_add_rls_policies.sql` (new)
- Git commits: 
  - `cebc14c` - Initial schema and RLS policies added
  - `6cede42` - Idempotent policy checks added

---

## Next Steps
1. Run `supabase db push --yes` from the project directory
2. Verify tables and policies exist in Supabase Dashboard
3. Test the full flow: Add task → See in UI → Task persists
4. Monitor for any permission errors in browser console or API logs
