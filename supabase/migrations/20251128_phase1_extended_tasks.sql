-- Phase 1: Extended Task System (Due dates, descriptions, labels, sub-tasks)
-- File: supabase/migrations/20251128_phase1_extended_tasks.sql

-- 1. Extend tasks table with new fields
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_time time;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS position integer default 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id bigint references tasks(id) on delete cascade;

-- 2. Create labels/tags table
CREATE TABLE IF NOT EXISTS task_labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text default '#8b5cf6',
  workspace_id uuid,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 3. Create many-to-many relationship between tasks and labels
CREATE TABLE IF NOT EXISTS task_label_links (
  task_id bigint references tasks(id) on delete cascade,
  label_id uuid references task_labels(id) on delete cascade,
  primary key (task_id, label_id)
);

-- 4. Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id bigint not null references tasks(id) on delete cascade,
  title text not null,
  description text,
  completed boolean default false,
  order_index integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Add progress tracking columns to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtask_count integer default 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS subtask_completed integer default 0;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_description ON tasks USING GIN(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_label_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_label_links(label_id);

-- Note: workspace_id indexes will be added in Phase 2 when workspace_id column is added to tasks
