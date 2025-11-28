# TaskBot Dashboard — Upgrade Roadmap

## Trello + Notion Feature Comparison & Enhancement Plan

### Current State Analysis

**Existing Features:**

- ✅ Basic task kanban board (todo, inprogress, done)
- ✅ Telegram bot integration (commands: /new, /mytasks, /done, /dashboard)
- ✅ Web app UI (responsive, animated)
- ✅ Real-time updates via Supabase
- ✅ Priority levels (low, medium, high, urgent)
- ✅ User profiles with telegram_id linking

**Current Limitations:**

- ❌ No due dates / deadlines
- ❌ No task descriptions or rich text
- ❌ No sub-tasks or checklist items
- ❌ No labels/tags for categorization
- ❌ No multiple boards/workspaces
- ❌ No comments or collaboration features
- ❌ No activity log or audit trail
- ❌ No task templates or recurring tasks
- ❌ No advanced filtering or search
- ❌ No team permissions or role-based access

---

## Trello Features vs TaskBot

| Feature            | Trello            | TaskBot              | Priority |
| ------------------ | ----------------- | -------------------- | -------- |
| Kanban Board       | ✅ Multi-board    | ✅ Single board      | Medium   |
| Lists/Columns      | ✅ Custom columns | ✅ Fixed (3 columns) | Low      |
| Card Details       | ✅ Rich           | ❌ Minimal           | **High** |
| Due Dates          | ✅ Full featured  | ❌ Missing           | **High** |
| Attachments        | ✅ File uploads   | ❌ Missing           | Medium   |
| Checklists         | ✅ Sub-items      | ❌ Missing           | **High** |
| Labels             | ✅ Color tags     | ❌ Missing           | High     |
| Comments           | ✅ Full threads   | ❌ Missing           | High     |
| Activity Log       | ✅ Complete       | ❌ Missing           | Medium   |
| Team Collaboration | ✅ Full           | ⚠️ Basic (Telegram)  | High     |
| Mobile App         | ✅ Native         | ⚠️ Web only          | Low      |

---

## Notion Features vs TaskBot

| Feature          | Notion           | TaskBot        | Priority |
| ---------------- | ---------------- | -------------- | -------- |
| Database Views   | ✅ Multiple      | ❌ Single view | Medium   |
| Rich Text Editor | ✅ Full featured | ❌ Text only   | **High** |
| Inline Database  | ✅ Relations     | ❌ Missing     | Medium   |
| Templates        | ✅ Full library  | ❌ Missing     | Medium   |
| Synced Blocks    | ✅ Yes           | ❌ No          | Low      |
| Version History  | ✅ Full          | ❌ Missing     | Low      |
| AI Integration   | ✅ Notion AI     | ❌ Missing     | Low      |
| Nested Pages     | ✅ Yes           | ❌ Flat tasks  | Low      |

---

## Phase 1: Core Enhancements (MVP+) — Weeks 1-2

### 1.1 Extended Task Fields

**Database Changes:**

```sql
ALTER TABLE tasks ADD COLUMN (
  due_date date,
  due_time time,
  description text,
  labels text[] default '{}',
  board_id uuid references boards(id),
  position integer,
  parent_task_id bigint references tasks(id) on delete cascade
);

CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_labels ON tasks USING GIN(labels);
```

**Implementation:**

- Update `src/app/api/tasks/route.ts` to support `due_date`, `description`, `labels`
- Add task detail modal in webapp
- Display due date with visual indicators (overdue = red, today = yellow, upcoming = blue)

### 1.2 Task Detail Panel

**New Component:** `src/components/TaskDetail.tsx`

- Show/edit title, description, priority, due date, labels
- Display assignee and created_at
- Modal or side-panel on task click

**Telegram Enhancement:**

```typescript
bot.command("task", async (ctx) => {
  const id = Number(ctx.message?.text?.split(" ")[1]);
  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .single();

  ctx.reply(
    `📋 #${task.id}: ${task.title}\n📝 ${
      task.description || "No description"
    }\n⏰ Due: ${task.due_date || "No deadline"}`
  );
});
```

### 1.3 Labels/Tags System

**Database:**

```sql
CREATE TABLE task_labels (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  color text default '#8b5cf6',
  workspace_id uuid,
  created_by uuid references profiles(id),
  created_at timestamp default now()
);

-- Link tasks to labels (many-to-many)
CREATE TABLE task_tag_links (
  task_id bigint references tasks(id) on delete cascade,
  label_id uuid references task_labels(id) on delete cascade,
  primary key (task_id, label_id)
);
```

**UI:** Color-coded badge display on each task card

---

## Phase 2: Collaboration & Permissions — Weeks 3-4

### 2.1 Multiple Workspaces

**Database:**

```sql
CREATE TABLE workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid references profiles(id),
  created_at timestamp default now()
);

CREATE TABLE workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  primary key (workspace_id, user_id)
);

ALTER TABLE tasks ADD COLUMN workspace_id uuid references workspaces(id);
ALTER TABLE boards ADD COLUMN workspace_id uuid references workspaces(id);
```

### 2.2 Role-Based Access Control (RBAC)

**RLS Policies:**

```sql
-- Users can view tasks in workspaces they're members of
CREATE POLICY "view_workspace_tasks" ON tasks
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can delete
CREATE POLICY "admin_delete_tasks" ON tasks
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

### 2.3 Activity Log / Audit Trail

**Database:**

```sql
CREATE TABLE activity_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id),
  task_id bigint references tasks(id),
  user_id uuid references profiles(id),
  action text not null,
  changes jsonb,
  created_at timestamp default now()
);

-- Trigger to auto-log changes
CREATE OR REPLACE FUNCTION log_task_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (workspace_id, task_id, user_id, action, changes)
  VALUES (NEW.workspace_id, NEW.id, auth.uid(), 'update', row_to_json(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_change_log AFTER UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_changes();
```

---

## Phase 3: Advanced Features — Weeks 5-6

### 3.1 Sub-Tasks / Checklists

**Database:**

```sql
CREATE TABLE subtasks (
  id uuid primary key default uuid_generate_v4(),
  task_id bigint references tasks(id) on delete cascade,
  title text not null,
  completed boolean default false,
  order_index integer,
  created_at timestamp default now()
);

-- Progress calculation in tasks table
ALTER TABLE tasks ADD COLUMN subtask_count integer default 0;
ALTER TABLE tasks ADD COLUMN subtask_completed integer default 0;
```

**API Endpoint:** `POST /api/tasks/{taskId}/subtasks`

### 3.2 Task Templates

**Database:**

```sql
CREATE TABLE task_templates (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id),
  name text not null,
  description text,
  template_data jsonb,
  created_by uuid references profiles(id),
  created_at timestamp default now()
);
```

### 3.3 Recurring Tasks

**Database:**

```sql
ALTER TABLE tasks ADD COLUMN (
  is_recurring boolean default false,
  recurrence_rule text,
  recurrence_next_date date
);

-- Every hour, check for tasks that need to recur
-- (Use a cron job or Supabase cron extension)
```

---

## Phase 4: Intelligence & Integrations — Weeks 7-8

### 4.1 Advanced Filtering & Search

**API Endpoint:** `POST /api/tasks/search`

```typescript
interface TaskFilter {
  assignee_id?: string;
  priority?: string[];
  labels?: string[];
  status?: string[];
  due_date_from?: string;
  due_date_to?: string;
  search_term?: string;
}
```

**UI:** Add filter panel in dashboard

### 4.2 Calendar View

**New Page:** `src/app/dashboard/calendar/page.tsx`

- Display tasks by due date
- Drag-drop to reschedule
- Month/week/day view toggle

### 4.3 Telegram Smart Commands

```typescript
bot.command("due", async (ctx) => {
  const user = await getOrCreateUser(ctx.from!);
  const { data: overdue } = await supabase
    .from("tasks")
    .select("id, title, due_date")
    .eq("assignee_id", user.id)
    .lt("due_date", new Date().toISOString().split("T")[0])
    .eq("status", "todo");

  ctx.reply(`⚠️ ${overdue?.length || 0} overdue tasks`);
});
```

---

## Implementation Priority Matrix

| Feature           | Effort | Impact | Dependencies | Start  |
| ----------------- | ------ | ------ | ------------ | ------ |
| Due Dates         | Low    | High   | None         | Week 1 |
| Task Descriptions | Low    | High   | None         | Week 1 |
| Labels/Tags       | Medium | High   | Database     | Week 1 |
| Workspaces        | High   | Medium | RLS redesign | Week 3 |
| Sub-Tasks         | Medium | Medium | Database     | Week 2 |
| Calendar View     | Medium | Medium | Due dates    | Week 4 |
| RBAC              | High   | High   | Workspaces   | Week 3 |
| Activity Log      | Low    | Low    | Triggers     | Week 4 |
| Templates         | Medium | Low    | Workspaces   | Week 5 |
| Recurring Tasks   | High   | Low    | Cron jobs    | Week 6 |

---

## Quick Start: Phase 1 Implementation

### Step 1: Expand Database Schema

```bash
cd c:\VsProject\taskbotDashboard
supabase link --project-ref qkiexuabetcejvbpztje
# Create migration file under supabase/migrations/
supabase db push
```

### Step 2: Update API Routes

- Modify `/api/tasks` to handle new fields
- Add new endpoint `/api/tasks/{id}` for detail view
- Add `/api/tasks/search` for filtering

### Step 3: Update UI Components

- Add `TaskDetailModal.tsx` component
- Add date picker to task creation form
- Add label selector

### Step 4: Test with Telegram Bot

```bash
npm run dev
# Test: /new Buy milk; Due today
```

---

## Metrics to Track Post-Launch

- User engagement (daily active users)
- Task completion rate
- Feature adoption (which are most used)
- Performance metrics (load times, realtime latency)
- Error rates in API endpoints

---

## Notes for AI Agents

When implementing these features:

1. **Always include `assignee_id`** in task inserts (required by RLS)
2. **Test RLS policies** before deploying (use `supabase-js` with service role for testing)
3. **Use Telegram commands for quick actions** (add, mark done, list)
4. **Keep web UI responsive** with RTL support
5. **Update `.github/copilot-instructions.md`** when adding new patterns
