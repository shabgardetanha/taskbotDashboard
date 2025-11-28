-- Phase 2: Workspaces, Collaboration & RBAC
-- File: supabase/migrations/20251129_phase2_workspaces_rbac.sql

-- 1. Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  owner_id uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create workspace members table with roles
CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamp with time zone default now(),
  primary key (workspace_id, user_id)
);

-- 3. Add workspace_id to tasks and boards (we'll add boards in next iteration)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS workspace_id uuid references workspaces(id) on delete cascade;
ALTER TABLE task_labels ADD COLUMN IF NOT EXISTS workspace_id uuid references workspaces(id) on delete cascade;

-- 4. Create activity logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  task_id bigint references tasks(id) on delete set null,
  user_id uuid not null references profiles(id) on delete cascade,
  action text not null,
  changes jsonb,
  created_at timestamp with time zone default now()
);

-- 5. Create boards table (Kanban columns)
CREATE TABLE IF NOT EXISTS boards (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- 6. Create board columns (todo, inprogress, done, or custom)
CREATE TABLE IF NOT EXISTS board_columns (
  id uuid primary key default uuid_generate_v4(),
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  status_value text not null,
  color text default '#8b5cf6',
  order_index integer default 0,
  created_at timestamp with time zone default now()
);

-- 7. Add indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_role ON workspace_members(role);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_workspace ON boards(workspace_id);

-- 8. Enable RLS on new tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for workspaces
CREATE POLICY "users can view workspaces they're members of" ON workspaces
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM workspace_members WHERE workspace_id = workspaces.id
    ) OR owner_id = auth.uid()
  );

CREATE POLICY "only owners can update workspace" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "only owners can delete workspace" ON workspaces
  FOR DELETE USING (owner_id = auth.uid());

-- 10. Create RLS policies for workspace members
CREATE POLICY "users can view workspace members" ON workspace_members
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "admins/owners can manage members" ON workspace_members
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- 11. Create RLS policies for activity logs
CREATE POLICY "users can view workspace activity" ON activity_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- 12. Function to log task changes
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (workspace_id, task_id, user_id, action, changes)
  VALUES (
    COALESCE(NEW.workspace_id, OLD.workspace_id),
    NEW.id,
    auth.uid(),
    CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN TG_OP = 'UPDATE' THEN 'updated' WHEN TG_OP = 'DELETE' THEN 'deleted' END,
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger for task changes
DROP TRIGGER IF EXISTS task_activity_log ON tasks;
CREATE TRIGGER task_activity_log AFTER INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();
