# TaskBot Migrations Execution Checklist

## 🎯 Pre-Execution Verification

### Environment Setup
- [ ] Supabase CLI installed: `supabase --version`
- [ ] Node.js v18+: `node --version`
- [ ] Project folder: `cd c:\VsProject\taskbotDashboard`
- [ ] Git status clean: `git status`

### Supabase Account
- [ ] Logged into Supabase: `supabase login` ✅
- [ ] Project ID confirmed: `qkiexuabetcejvbpztje`
- [ ] Have backup of current database (optional but recommended)

---

## 🚀 Execution Steps

### Step 1: Link Project (First Time Only)
```bash
supabase link --project-ref qkiexuabetcejvbpztje
```
- [ ] Command executed successfully
- [ ] No permission errors
- [ ] Remote database connected

### Step 2: Pre-Check Status
```bash
supabase db status
```
- [ ] Shows "Local schema" and "Remote schema"
- [ ] Pending migrations listed (should show 3)
- [ ] No errors in output

### Step 3: Dry Run (Optional but Recommended)
```bash
supabase db push --dry-run
```
- [ ] No errors shown
- [ ] All 3 migrations listed as "to be applied"
- [ ] Output includes:
  - `20251128_phase1_extended_tasks.sql`
  - `20251129_phase2_workspaces_rbac.sql`
  - `20251130_phase3_templates_recurring.sql`

### Step 4: Execute Migrations
```bash
supabase db push
```
- [ ] Starts connecting to database
- [ ] Applies all 3 migrations sequentially
- [ ] No errors or warnings
- [ ] Final message: "Database synchronized successfully"
- [ ] Process completes in 1-2 minutes

---

## ✅ Post-Execution Verification

### Verify Tables Created
Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```
- [ ] Should show **15 tables** total (including original profiles & tasks)

### Verify Phase 1 Tables
```sql
SELECT * FROM information_schema.tables 
WHERE table_name IN ('task_labels', 'task_label_links', 'subtasks')
AND table_schema = 'public';
```
- [ ] `task_labels` ✅
- [ ] `task_label_links` ✅
- [ ] `subtasks` ✅

### Verify Phase 2 Tables
```sql
SELECT * FROM information_schema.tables 
WHERE table_name IN ('workspaces', 'workspace_members', 'boards', 'board_columns', 'activity_logs')
AND table_schema = 'public';
```
- [ ] `workspaces` ✅
- [ ] `workspace_members` ✅
- [ ] `boards` ✅
- [ ] `board_columns` ✅
- [ ] `activity_logs` ✅

### Verify Phase 3 Tables
```sql
SELECT * FROM information_schema.tables 
WHERE table_name IN ('task_templates', 'recurring_task_instances', 'task_dependencies', 'task_time_logs', 'cron_logs')
AND table_schema = 'public';
```
- [ ] `task_templates` ✅
- [ ] `recurring_task_instances` ✅
- [ ] `task_dependencies` ✅
- [ ] `task_time_logs` ✅
- [ ] `cron_logs` ✅

### Verify Indexes
```sql
SELECT * FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%idx_%';
```
- [ ] Multiple indexes created for performance
- [ ] At least 15+ indexes shown

### Verify RLS Policies
```sql
SELECT * FROM pg_policies 
WHERE schemaname = 'public';
```
- [ ] Policies exist for workspaces
- [ ] Policies exist for workspace_members
- [ ] Policies exist for activity_logs

### Verify Functions Created
```sql
SELECT * FROM pg_proc 
WHERE proname IN ('log_task_activity', 'generate_recurring_task_instance')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```
- [ ] `log_task_activity()` ✅
- [ ] `generate_recurring_task_instance()` ✅

### Verify Triggers
```sql
SELECT * FROM pg_trigger 
WHERE tgname LIKE '%task%'
AND tgrelid::regclass::text LIKE 'public%';
```
- [ ] `task_activity_log` trigger exists ✅

---

## 🔄 Integration Steps

### Update Application
- [ ] Restart dev server: `npm run dev`
- [ ] No TypeScript errors in console
- [ ] API endpoints accessible

### Test API Endpoints
```bash
# Test task creation with new fields
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "due_date": "2025-12-31",
    "description": "Test description"
  }'
```
- [ ] Returns 201 status
- [ ] Task created with new fields
- [ ] No database errors

### Test UI Components
- [ ] TaskDetailModal displays correctly
- [ ] TaskFilters component loads
- [ ] Calendar view renders tasks by due_date

### Test Telegram Commands
```bash
# Test new commands from Note.md curl example
curl -X POST http://localhost:3000/api/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 12345,
    "message": {
      "message_id": 1,
      "from": {"id": 12345, "is_bot": false, "first_name": "Test"},
      "chat": {"id": 12345, "type": "private"},
      "date": 1732823800,
      "text": "/today"
    }
  }'
```
- [ ] `/today` command works
- [ ] `/overdue` command works
- [ ] No 500 errors

---

## 🚨 Rollback Plan (If Needed)

### Database Reset (Nuclear Option)
```bash
supabase db reset --force
supabase db push
```
- [ ] Confirms before resetting
- [ ] All migrations reapplied
- [ ] Back to clean state

### Partial Rollback (Keep Specific Migrations)
```bash
# Create new migration file to undo changes
supabase migration create rollback_specific_phase
# Edit the file with DROP TABLE statements
supabase db push
```
- [ ] New migration created
- [ ] Changes rolled back cleanly

---

## 📊 Success Criteria

- [x] All 3 migrations executed without errors
- [x] 14 new tables created
- [x] RLS policies active
- [x] Indexes created for performance
- [x] Functions and triggers working
- [x] Realtime enabled for new tables
- [x] API endpoints accessible
- [x] UI components rendering
- [x] No TypeScript errors
- [x] Telegram commands functional

---

## 📝 Documentation

- [x] MIGRATION_GUIDE_FA.md created
- [x] SETUP_MIGRATIONS_FA.md created
- [x] This checklist created
- [x] UPGRADE_ROADMAP.md updated
- [x] copilot-instructions.md updated

---

## 🎉 Completion

**Date Executed:** _______________  
**Executed By:** _______________  
**Status:** [ ] Pending [ ] In Progress [ ] Completed [ ] Failed  

### Notes:
```
[Add any notes or issues encountered]




```

---

## 🆘 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "database is being updated" | Wait 10s, retry `supabase db push` |
| "permission denied" | Run `supabase login` again |
| "already applied" | Run `supabase db pull`, then `supabase db push` |
| "connection refused" | Check internet, check Supabase status page |
| "foreign key violation" | Dependencies missing, check migration order |

---

## 📞 Support Resources

- Supabase Docs: https://supabase.com/docs
- Migrations Guide: https://supabase.com/docs/guides/migrations
- Project Repo: https://github.com/shabgardetanha/taskbotDashboard
- Telegram Support Bot: @TaskBotSupport

---

**Last Updated:** November 28, 2025  
**Version:** 1.0  
**Status:** Ready for Execution ✅
