#!/usr/bin/env bash
set -euo pipefail

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL not set. Set repository secret SUPABASE_DB_URL."
  exit 1
fi

# Use psql; assume SUPABASE_DB_URL is a valid postgres connection string
SQLS=(
"SELECT to_regclass('public.idx_tasks_assignee_status') IS NOT NULL AS ok;"
"SELECT to_regclass('public.idx_tasks_workspace_status') IS NOT NULL AS ok;"
"SELECT to_regclass('public.idx_tasks_due_date') IS NOT NULL AS ok;"
"SELECT to_regclass('public.idx_tasks_parent') IS NOT NULL AS ok;"
"SELECT to_regclass('public.idx_task_labels_task') IS NOT NULL AS ok;"
"SELECT to_regclass('public.idx_task_labels_label') IS NOT NULL AS ok;"
)

for q in "${SQLS[@]}"; do
  res=$(psql "$SUPABASE_DB_URL" -t -A -c "$q" || true)
  if [[ "$res" != "t" ]]; then
    echo "ERROR: required index missing or inaccessible. Query output: $res"
    exit 1
  fi
done

echo "OK: All required indexes exist."
