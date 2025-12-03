-- Fix activity_logs to allow null workspace_id for backward compatibility
-- File: supabase/migrations/20251203090000_fix_activity_logs_nullable.sql

-- Allow workspace_id to be null in activity_logs for tasks without workspace
ALTER TABLE activity_logs ALTER COLUMN workspace_id DROP NOT NULL;

-- Update the trigger to handle null workspace_id gracefully
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if we have a valid workspace_id or if it's a task creation/update
  IF NEW.workspace_id IS NOT NULL OR TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (workspace_id, task_id, user_id, action, changes)
    VALUES (
      NEW.workspace_id,
      NEW.id,
      auth.uid(),
      CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN TG_OP = 'UPDATE' THEN 'updated' WHEN TG_OP = 'DELETE' THEN 'deleted' END,
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END
    );
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policy to handle null workspace_id
DROP POLICY IF EXISTS "users can view workspace activity" ON activity_logs;
CREATE POLICY "users can view workspace activity" ON activity_logs
  FOR SELECT USING (
    workspace_id IS NULL OR
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
