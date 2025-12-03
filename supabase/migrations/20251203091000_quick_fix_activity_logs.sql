-- Quick fix: Temporarily disable activity logging for tasks without workspace
-- File: supabase/migrations/20251203091000_quick_fix_activity_logs.sql

-- Temporarily disable the trigger
DROP TRIGGER IF EXISTS task_activity_log ON tasks;

-- Create a simpler trigger that only logs when workspace_id is not null
CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log activities for tasks that have a workspace
  IF NEW.workspace_id IS NOT NULL THEN
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

-- Re-enable the trigger
CREATE TRIGGER task_activity_log AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();
