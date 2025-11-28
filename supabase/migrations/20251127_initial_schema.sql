-- Initial Schema Setup
-- File: supabase/migrations/20251127_initial_schema.sql
-- Purpose: Define base tables (profiles, tasks) with RLS policies

-- 1. Create profiles table (if not exists)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid primary key references auth.users on delete cascade,
  telegram_id bigint unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Create base tasks table (if not exists)
CREATE TABLE IF NOT EXISTS tasks (
  id bigint primary key generated always as identity,
  title text not null,
  description text,
  status text default 'todo',
  priority text default 'medium',
  assignee_id uuid references profiles(id) on delete set null,
  due_date date,
  due_time time,
  position integer default 0,
  parent_task_id bigint references tasks(id) on delete cascade,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Enable RLS (safe - will only enable if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for profiles (safe - use IF NOT EXISTS syntax)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_public_read') THEN
    CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_user_update') THEN
    CREATE POLICY "profiles_user_update" ON profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END
$$;

-- 5. Create RLS policies for tasks
-- Public read for all tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'tasks_public_read') THEN
    CREATE POLICY "tasks_public_read" ON tasks FOR SELECT USING (true);
  END IF;
END
$$;

-- Authenticated users can create tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'tasks_authenticated_create') THEN
    CREATE POLICY "tasks_authenticated_create" ON tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');
  END IF;
END
$$;

-- Users can update their assigned tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'tasks_user_update') THEN
    CREATE POLICY "tasks_user_update" ON tasks FOR UPDATE USING (assignee_id = auth.uid() OR auth.role() = 'service_role') WITH CHECK (assignee_id = auth.uid() OR auth.role() = 'service_role');
  END IF;
END
$$;

-- Users can delete their assigned tasks
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tasks' AND policyname = 'tasks_user_delete') THEN
    CREATE POLICY "tasks_user_delete" ON tasks FOR DELETE USING (assignee_id = auth.uid() OR auth.role() = 'service_role');
  END IF;
END
$$;
