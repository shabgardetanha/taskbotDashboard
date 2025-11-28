-- Fix log_task_activity trigger to avoid NULL user_id when auth.uid() is not present
-- This migration replaces the function to use sensible fallbacks:
--   1) auth.uid()
--   2) NEW.assignee_id
--   3) workspace owner_id (if workspace_id provided)

CREATE OR REPLACE FUNCTION log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  effective_user uuid;
  ws_owner uuid;
BEGIN
  -- Determine a non-null user id to insert into activity_logs
  IF TG_OP = 'DELETE' THEN
    -- For deletes, OLD will be present
    effective_user := COALESCE(auth.uid(), OLD.assignee_id);
    IF effective_user IS NULL AND OLD.workspace_id IS NOT NULL THEN
      SELECT owner_id INTO ws_owner FROM workspaces WHERE id = OLD.workspace_id LIMIT 1;
      effective_user := COALESCE(effective_user, ws_owner);
    END IF;
    INSERT INTO activity_logs (workspace_id, task_id, user_id, action, changes)
    VALUES (COALESCE(OLD.workspace_id, NULL), OLD.id, effective_user,
      CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN TG_OP = 'UPDATE' THEN 'updated' WHEN TG_OP = 'DELETE' THEN 'deleted' END,
      row_to_json(OLD));
    RETURN OLD;
  ELSE
    -- INSERT or UPDATE
    effective_user := COALESCE(auth.uid(), NEW.assignee_id);
    IF effective_user IS NULL AND COALESCE(NEW.workspace_id, OLD.workspace_id) IS NOT NULL THEN
      SELECT owner_id INTO ws_owner FROM workspaces WHERE id = COALESCE(NEW.workspace_id, OLD.workspace_id) LIMIT 1;
      effective_user := COALESCE(effective_user, ws_owner);
    END IF;

    INSERT INTO activity_logs (workspace_id, task_id, user_id, action, changes)
    VALUES (
      COALESCE(NEW.workspace_id, OLD.workspace_id),
      NEW.id,
      effective_user,
      CASE WHEN TG_OP = 'INSERT' THEN 'created' WHEN TG_OP = 'UPDATE' THEN 'updated' WHEN TG_OP = 'DELETE' THEN 'deleted' END,
      row_to_json(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger to ensure it's using the updated function (safe: drop if exists)
DROP TRIGGER IF EXISTS task_activity_log ON tasks;
CREATE TRIGGER task_activity_log AFTER INSERT OR UPDATE OR DELETE ON tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();
