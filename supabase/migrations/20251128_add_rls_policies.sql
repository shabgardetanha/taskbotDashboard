-- RLS Policies for Extended Tables (Phase 1)
-- File: supabase/migrations/20251128_add_rls_policies.sql
-- Purpose: Enable RLS and create policies for new Phase 1 tables (labels, subtasks)

-- 1. Enable RLS on new Phase 1 tables
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_label_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- 2. Create policies for task_labels table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_labels' AND policyname = 'users_can_view_labels') THEN
    CREATE POLICY "users_can_view_labels" ON task_labels FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_labels' AND policyname = 'users_can_create_labels') THEN
    CREATE POLICY "users_can_create_labels" ON task_labels FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_labels' AND policyname = 'users_can_update_labels') THEN
    CREATE POLICY "users_can_update_labels" ON task_labels FOR UPDATE WITH CHECK (true);
  END IF;
END
$$;

-- 3. Create policies for task_label_links table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_label_links' AND policyname = 'users_can_view_label_links') THEN
    CREATE POLICY "users_can_view_label_links" ON task_label_links FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_label_links' AND policyname = 'users_can_manage_label_links') THEN
    CREATE POLICY "users_can_manage_label_links" ON task_label_links FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'task_label_links' AND policyname = 'users_can_update_label_links') THEN
    CREATE POLICY "users_can_update_label_links" ON task_label_links FOR UPDATE WITH CHECK (true);
  END IF;
END
$$;

-- 4. Create policies for subtasks table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subtasks' AND policyname = 'users_can_view_subtasks') THEN
    CREATE POLICY "users_can_view_subtasks" ON subtasks FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subtasks' AND policyname = 'users_can_manage_subtasks') THEN
    CREATE POLICY "users_can_manage_subtasks" ON subtasks FOR INSERT WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subtasks' AND policyname = 'users_can_update_subtasks') THEN
    CREATE POLICY "users_can_update_subtasks" ON subtasks FOR UPDATE WITH CHECK (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subtasks' AND policyname = 'users_can_delete_subtasks') THEN
    CREATE POLICY "users_can_delete_subtasks" ON subtasks FOR DELETE USING (true);
  END IF;
END
$$;
