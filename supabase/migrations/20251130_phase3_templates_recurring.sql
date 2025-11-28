-- Phase 3: Advanced Features (Templates & Recurring Tasks)
-- File: supabase/migrations/20251130_phase3_templates_recurring.sql

-- 1. Create task templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  description text,
  template_data jsonb not null,
  category text default 'general',
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Add recurring task fields to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring boolean default false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_next_date date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS original_task_id bigint references tasks(id) on delete set null;

-- 3. Create recurring task instances history
CREATE TABLE IF NOT EXISTS recurring_task_instances (
  id uuid primary key default gen_random_uuid(),
  original_task_id bigint not null references tasks(id) on delete cascade,
  instance_task_id bigint not null references tasks(id) on delete cascade,
  instance_date date not null,
  created_at timestamp with time zone default now()
);

-- 4. Create cron logs for tracking recurring task generation
CREATE TABLE IF NOT EXISTS cron_logs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  last_run timestamp with time zone,
  next_run timestamp with time zone,
  status text default 'pending',
  error_message text,
  created_at timestamp with time zone default now()
);

-- 5. Create task dependencies/blockers table
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id bigint not null references tasks(id) on delete cascade,
  depends_on_task_id bigint not null references tasks(id) on delete cascade,
  dependency_type text default 'blocks' check (dependency_type in ('blocks', 'depends_on', 'relates_to')),
  primary key (task_id, depends_on_task_id)
);

-- 6. Create task time tracking table (for future burndown charts)
CREATE TABLE IF NOT EXISTS task_time_logs (
  id uuid primary key default gen_random_uuid(),
  task_id bigint not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  time_spent integer not null,
  unit text default 'minutes' check (unit in ('minutes', 'hours', 'days')),
  notes text,
  logged_at timestamp with time zone default now()
);

-- 7. Add indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_workspace ON task_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_tasks_recurring ON tasks(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence_date ON tasks(recurrence_next_date);
CREATE INDEX IF NOT EXISTS idx_recurring_instances_original ON recurring_task_instances(original_task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_logs_task ON task_time_logs(task_id);

-- 8. Function to generate next recurring task instance
CREATE OR REPLACE FUNCTION generate_recurring_task_instance(task_id bigint)
RETURNS void AS $$
DECLARE
  v_task RECORD;
  v_next_date date;
BEGIN
  SELECT * INTO v_task FROM tasks WHERE id = task_id AND is_recurring = true;

  IF v_task IS NOT NULL THEN
    -- Calculate next date based on recurrence rule
    -- Simple implementation: daily, weekly, monthly
    IF v_task.recurrence_rule = 'daily' THEN
      v_next_date := CURRENT_DATE + INTERVAL '1 day';
    ELSIF v_task.recurrence_rule = 'weekly' THEN
      v_next_date := CURRENT_DATE + INTERVAL '7 days';
    ELSIF v_task.recurrence_rule = 'monthly' THEN
      v_next_date := CURRENT_DATE + INTERVAL '1 month';
    ELSE
      RETURN;
    END IF;

    -- Create new task instance
    INSERT INTO tasks (
      title, description, priority, status, assignee_id, workspace_id,
      due_date, due_time, is_recurring, recurrence_rule, original_task_id
    ) VALUES (
      v_task.title, v_task.description, v_task.priority, 'todo', v_task.assignee_id, v_task.workspace_id,
      v_next_date, v_task.due_time, true, v_task.recurrence_rule, v_task.id
    );

    -- Log the instance
    INSERT INTO recurring_task_instances (original_task_id, instance_task_id, instance_date)
    VALUES (v_task.id, currval('tasks_id_seq'), v_next_date);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Enable RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_task_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_time_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for templates
CREATE POLICY "users can view workspace templates" ON task_templates
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members can create templates" ON task_templates
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
