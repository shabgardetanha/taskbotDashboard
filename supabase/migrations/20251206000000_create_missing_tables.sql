-- Missing Tables Migration
-- File: supabase/migrations/20251206000000_create_missing_tables.sql
-- Purpose: Create activity_logs and notifications tables that were missing

-- 1. Create activity_logs table (if not exists)
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  task_id bigint references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  action text not null check (action in (
    'created', 'updated', 'deleted', 'commented', 'attachment_added', 'attachment_removed',
    'assigned', 'unassigned', 'status_changed', 'priority_changed', 'due_date_changed',
    'label_added', 'label_removed', 'subtask_added', 'subtask_completed'
  )),
  details jsonb,
  created_at timestamp with time zone default now()
);

-- 2. Create notifications table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  workspace_id uuid references workspaces(id) on delete cascade,
  task_id bigint references tasks(id) on delete cascade,
  type text not null check (type in (
    'task_assigned', 'task_due', 'comment_mention', 'workspace_invite', 'task_updated'
  )),
  title text not null,
  message text not null,
  data jsonb,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. Create user_preferences table (if not exists)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  theme text default 'light' check (theme in ('light', 'dark', 'auto')),
  language text default 'fa',
  timezone text default 'Asia/Tehran',
  email_notifications boolean default true,
  telegram_notifications boolean default true,
  weekly_digest boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Enable RLS on new tables
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for activity_logs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'workspace members can view activity logs') THEN
    CREATE POLICY "workspace members can view activity logs" ON activity_logs
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'activity_logs' AND policyname = 'system can create activity logs') THEN
    CREATE POLICY "system can create activity logs" ON activity_logs
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- 6. RLS Policies for notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'users can view own notifications') THEN
    CREATE POLICY "users can view own notifications" ON notifications
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'system can create notifications') THEN
    CREATE POLICY "system can create notifications" ON notifications
      FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

-- 7. RLS Policies for user_preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_preferences' AND policyname = 'users can manage own preferences') THEN
    CREATE POLICY "users can manage own preferences" ON user_preferences
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$$;

-- 8. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at desc);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at desc);

-- 9. Create function for activity logging
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id uuid;
  action_type text;
  details_data jsonb;
BEGIN
  -- Get workspace_id from task
  SELECT t.workspace_id INTO workspace_id FROM tasks t WHERE t.id = NEW.id;

  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    details_data := jsonb_build_object('task', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    details_data := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSE
    RETURN COALESCE(OLD, NEW);
  END IF;

  -- Log activity
  INSERT INTO activity_logs (workspace_id, task_id, user_id, action, details)
  VALUES (workspace_id, NEW.id, auth.uid(), action_type, details_data);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for activity logging
DROP TRIGGER IF EXISTS task_activity_trigger ON tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_activity();

-- 11. Insert default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;
