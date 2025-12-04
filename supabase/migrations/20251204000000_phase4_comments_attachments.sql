-- Phase 4: Comments System & File Attachments
-- File: supabase/migrations/20251204_phase4_comments_attachments.sql

-- 1. Create task comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id bigint not null references tasks(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  parent_id uuid references task_comments(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id bigint not null references tasks(id) on delete cascade,
  filename text not null,
  original_name text not null,
  file_size bigint not null,
  mime_type text not null,
  file_path text not null,
  uploaded_by uuid not null references profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- 3. Create activity logs table (enhanced)
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

-- 4. Create notifications table
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

-- 5. Create user preferences table
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

-- 6. Add indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON task_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_task ON activity_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at desc);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at desc);

-- 7. Enable RLS
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for comments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'users can view task comments') THEN
    CREATE POLICY "users can view task comments" ON task_comments
      FOR SELECT USING (
        task_id IN (
          SELECT id FROM tasks WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'users can create comments') THEN
    CREATE POLICY "users can create comments" ON task_comments
      FOR INSERT WITH CHECK (
        author_id = auth.uid() AND
        task_id IN (
          SELECT id FROM tasks WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'users can update own comments') THEN
    CREATE POLICY "users can update own comments" ON task_comments
      FOR UPDATE USING (author_id = auth.uid());
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_comments' AND policyname = 'users can delete own comments') THEN
    CREATE POLICY "users can delete own comments" ON task_comments
      FOR DELETE USING (author_id = auth.uid());
  END IF;
END
$$;

-- 9. RLS Policies for attachments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_attachments' AND policyname = 'users can view task attachments') THEN
    CREATE POLICY "users can view task attachments" ON task_attachments
      FOR SELECT USING (
        task_id IN (
          SELECT id FROM tasks WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_attachments' AND policyname = 'workspace members can upload attachments') THEN
    CREATE POLICY "workspace members can upload attachments" ON task_attachments
      FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        task_id IN (
          SELECT id FROM tasks WHERE workspace_id IN (
            SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END
$$;

-- 10. RLS Policies for notifications
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

-- 11. RLS Policies for user preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_preferences' AND policyname = 'users can manage own preferences') THEN
    CREATE POLICY "users can manage own preferences" ON user_preferences
      FOR ALL USING (user_id = auth.uid());
  END IF;
END
$$;

-- 12. Functions for activity logging
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id uuid;
  action_type text;
  details jsonb;
BEGIN
  -- Get workspace_id from task
  SELECT t.workspace_id INTO workspace_id FROM tasks t WHERE t.id = NEW.id;

  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    details := jsonb_build_object('task', row_to_json(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    details := jsonb_build_object('old', row_to_json(OLD), 'new', row_to_json(NEW));
  ELSE
    RETURN COALESCE(OLD, NEW);
  END IF;

  -- Log activity
  INSERT INTO activity_logs (workspace_id, task_id, user_id, action, details)
  VALUES (workspace_id, NEW.id, auth.uid(), action_type, details);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 13. Create triggers for activity logging
DROP TRIGGER IF EXISTS task_activity_trigger ON tasks;
CREATE TRIGGER task_activity_trigger
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_activity();

-- 14. Function to create notifications
CREATE OR REPLACE FUNCTION create_task_notification(
  p_user_id uuid,
  p_workspace_id uuid,
  p_task_id bigint,
  p_type text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, workspace_id, task_id, type, title, message, data)
  VALUES (p_user_id, p_workspace_id, p_task_id, p_type, p_title, p_message, p_data);
END;
$$ LANGUAGE plpgsql;

-- 15. Insert default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_preferences)
ON CONFLICT (user_id) DO NOTHING;
