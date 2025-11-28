# How Migrations Are Executed in Supabase - Visual Guide

## 🔄 Migration Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Your Local Machine                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  supabase/migrations/                                           │
│  ├── 20251128_phase1_extended_tasks.sql (Phase 1)              │
│  ├── 20251129_phase2_workspaces_rbac.sql (Phase 2)             │
│  └── 20251130_phase3_templates_recurring.sql (Phase 3)         │
│                                                                 │
│  Command: supabase db push                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Detects pending migrations                           │  │
│  │ ✅ Uploads .sql files to Supabase                       │  │
│  │ ✅ Executes them in order                               │  │
│  │ ✅ Creates tables, indexes, RLS policies                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
│                          │ HTTPS Connection                     │
│                          ▼                                      │
└─────────────────────────────────────────────────────────────────┘
                           │
                           │
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Cloud                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PostgreSQL Database (qkiexuabetcejvbpztje)                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │ Phase 1: Extended Tasks                               │  │
│  │  ✅ task_labels                                        │  │
│  │  ✅ task_label_links                                   │  │
│  │  ✅ subtasks                                           │  │
│  │                                                         │  │
│  │ Phase 2: Workspaces & RBAC                            │  │
│  │  ✅ workspaces                                         │  │
│  │  ✅ workspace_members                                  │  │
│  │  ✅ boards & board_columns                             │  │
│  │  ✅ activity_logs                                      │  │
│  │  ✅ RLS Policies & Triggers                            │  │
│  │                                                         │  │
│  │ Phase 3: Templates & Recurring                        │  │
│  │  ✅ task_templates                                     │  │
│  │  ✅ recurring_task_instances                           │  │
│  │  ✅ task_dependencies                                  │  │
│  │  ✅ task_time_logs                                     │  │
│  │  ✅ cron_logs                                          │  │
│  │                                                         │  │
│  │ Original Tables (Preserved):                          │  │
│  │  ✅ profiles (unchanged)                               │  │
│  │  ✅ tasks (extended with new columns)                  │  │
│  │                                                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Web Dashboard (supabase.com)                                  │
│  ├── SQL Editor: Run queries directly                         │
│  ├── Table Editor: Browse data                                │
│  ├── Logs: View database activity                             │
│  └── Monitor: Check performance                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Execution

### Step 1: Local Files Detected

```
Terminal> supabase db push

✓ Connecting to remote database
✓ Pulling remote schema
✓ Analyzing local migrations
```

**Status:** Checking which .sql files are pending

### Step 2: Dry Run (Optional)

```
Terminal> supabase db push --dry-run

Pending migrations:
  [1/3] 20251128_phase1_extended_tasks.sql
  [2/3] 20251129_phase2_workspaces_rbac.sql
  [3/3] 20251130_phase3_templates_recurring.sql

Ready to apply 3 migrations
```

**Status:** Preview without making changes

### Step 3: User Confirmation

```
Terminal> supabase db push

Ready to apply 3 migrations. Continue? (y/n)
> y
```

**Status:** Waiting for approval

### Step 4: Phase 1 Execution

```
Applying: 20251128_phase1_extended_tasks.sql [████████░░] 33%

Creating:
  ✓ task_labels table
  ✓ task_label_links table
  ✓ subtasks table
  ✓ idx_tasks_due_date index
  ✓ idx_subtasks_task index
  ✓ Altering tasks table (added: due_date, due_time, description)

Status: ✅ Phase 1 Complete
```

### Step 5: Phase 2 Execution

```
Applying: 20251129_phase2_workspaces_rbac.sql [████████████░░░] 66%

Creating:
  ✓ workspaces table
  ✓ workspace_members table
  ✓ boards table
  ✓ board_columns table
  ✓ activity_logs table
  ✓ log_task_activity() function
  ✓ task_activity_log trigger
  ✓ RLS Policy: view workspaces
  ✓ RLS Policy: manage members
  ✓ RLS Policy: view activity logs

Status: ✅ Phase 2 Complete
```

### Step 6: Phase 3 Execution

```
Applying: 20251130_phase3_templates_recurring_sql [████████████████] 100%

Creating:
  ✓ task_templates table
  ✓ recurring_task_instances table
  ✓ task_dependencies table
  ✓ task_time_logs table
  ✓ cron_logs table
  ✓ generate_recurring_task_instance() function
  ✓ RLS Policy: view templates

Status: ✅ Phase 3 Complete
```

### Step 7: Final Confirmation

```
✅ All migrations applied successfully
✅ Database schema synchronized
✅ 14 new tables created
✅ 5+ RLS policies enabled
✅ Realtime enabled for new tables

Database is now at version: 20251130
```

---

## 🗄️ Database Structure After Migrations

```sql
Public Schema
├── Core Tables (Original)
│   ├── profiles
│   │   ├── id (UUID)
│   │   ├── telegram_id (BigInt)
│   │   ├── username (Text)
│   │   ├── full_name (Text)
│   │   └── timestamps
│   │
│   └── tasks (Extended)
│       ├── id (BigInt)
│       ├── title, description
│       ├── due_date, due_time (NEW)
│       ├── status, priority
│       ├── assignee_id (FK: profiles)
│       ├── workspace_id (FK: workspaces) (NEW)
│       ├── parent_task_id (FK: tasks) (NEW)
│       ├── subtask_count (NEW)
│       └── timestamps
│
├── Phase 1: Task Enhancement
│   ├── task_labels
│   │   ├── id, name, color
│   │   ├── workspace_id (FK)
│   │   └── created_by (FK: profiles)
│   │
│   ├── task_label_links (M2M)
│   │   ├── task_id (FK)
│   │   └── label_id (FK)
│   │
│   └── subtasks
│       ├── id, task_id (FK)
│       ├── title, description
│       ├── completed
│       └── order_index
│
├── Phase 2: Collaboration
│   ├── workspaces
│   │   ├── id, name, description
│   │   ├── owner_id (FK: profiles)
│   │   └── timestamps
│   │
│   ├── workspace_members (Role-based)
│   │   ├── workspace_id (FK)
│   │   ├── user_id (FK: profiles)
│   │   ├── role (owner/admin/member/viewer)
│   │   └── joined_at
│   │
│   ├── boards
│   │   ├── id, name
│   │   ├── workspace_id (FK)
│   │   └── order_index
│   │
│   ├── board_columns
│   │   ├── id, name
│   │   ├── board_id (FK)
│   │   ├── status_value
│   │   └── color
│   │
│   └── activity_logs (Audit Trail)
│       ├── id, action
│       ├── workspace_id (FK)
│       ├── task_id (FK)
│       ├── user_id (FK: profiles)
│       ├── changes (JSONB)
│       └── created_at
│
└── Phase 3: Advanced Features
    ├── task_templates
    │   ├── id, name, description
    │   ├── template_data (JSONB)
    │   ├── workspace_id (FK)
    │   ├── category
    │   └── created_by (FK: profiles)
    │
    ├── recurring_task_instances
    │   ├── original_task_id (FK)
    │   ├── instance_task_id (FK)
    │   └── instance_date
    │
    ├── task_dependencies
    │   ├── task_id (FK)
    │   ├── depends_on_task_id (FK)
    │   └── dependency_type
    │
    ├── task_time_logs
    │   ├── task_id (FK)
    │   ├── user_id (FK: profiles)
    │   ├── time_spent
    │   ├── unit (minutes/hours/days)
    │   └── logged_at
    │
    └── cron_logs
        ├── job_name
        ├── last_run, next_run
        ├── status
        └── error_message
```

---

## 🔐 Security: RLS Policies in Action

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Request                                 │
├─────────────────────────────────────────────────────────────────┤
│ Query: SELECT * FROM tasks WHERE workspace_id = 'ABC'          │
│ User ID: user123                                               │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  RLS Policy Check                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Policy: "users can view tasks in workspaces they're members of"│
│                                                                 │
│ Check: Is user123 a member of workspace ABC?                   │
│   ✓ Query workspace_members table                              │
│   ✓ User MUST have (workspace_id='ABC' AND user_id='user123')  │
│                                                                 │
│ If YES → ✅ Return tasks                                       │
│ If NO  → ❌ Return empty result (403 Forbidden)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Table Relationships Diagram

```
                        profiles
                        ├─┐
                        │ │
         ┌──────────────┼─┼──────────────────────┐
         │              │ │                      │
      workspace       user_id               telegram_id
      (owner_id)        │ │
         ▲              │ │
         │              │ └─ workspace_members
         │              │         ├── workspace_id
         │              │         └── user_id
         │              │
      workspaces     tasks (extended)
         ├─┐          ├──┬──────────┬─────┐
         │ │          │  │          │     │
      boards │      assignee_id   workspace_id
         │  │       (FK)          (FK)
         │  └─ workspace_members    │
         │          │            parent_task_id (FK)
         │          │               │
      board_columns │          subtasks
         │          │          task_labels
         │          │          task_label_links
    status_value  activity_logs
         │          │
         └─ tasks   │
                    └─ task_templates
                    └─ recurring_task_instances
                    └─ task_dependencies
                    └─ task_time_logs
```

---

## ⏱️ Execution Timeline

```
Time    Event
────────────────────────────────────────────────
0:00    $ supabase db push
0:05    ✓ Connected to Supabase
0:10    ✓ Fetched remote schema
0:15    ✓ Compared with local migrations
0:20    ✓ Detected 3 pending migrations
0:25    ✓ User confirmed execution
0:30    → Executing Phase 1 (12 statements)
1:00    ✓ Phase 1 Complete
1:05    → Executing Phase 2 (25 statements)
2:30    ✓ Phase 2 Complete
2:35    → Executing Phase 3 (18 statements)
3:45    ✓ Phase 3 Complete
3:50    ✓ All migrations applied
4:00    ✓ Database synchronized
────────────────────────────────────────────────
Total: ~4 minutes
```

---

## 🎯 Key Takeaways

1. **Migrations are Immutable**

   - Once executed, they cannot be undone directly
   - Create new migration files for rollbacks

2. **Execution Order Matters**

   - Phase 1 → Phase 2 → Phase 3 (in sequence)
   - Dependencies resolved automatically

3. **RLS Protects Data**

   - Each query is filtered by user permissions
   - Happens at database level (most secure)

4. **Realtime Enabled**

   - New tables automatically subscribed to Realtime
   - Frontend can receive live updates

5. **No Downtime**
   - Migrations applied live in production
   - Existing data preserved
   - Tables added without affecting current system

---

## 🚀 After Migrations Complete

```javascript
// Your API can now use new tables:

// Phase 1: Add label to task
await supabase
  .from("task_label_links")
  .insert({ task_id: 1, label_id: "uuid" });
```
