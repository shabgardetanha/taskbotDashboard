# خلاصه کامل: چگونه جداول جدید در Supabase اجرا می‌شوند

## 🎯 پاسخ سریع

جداول جدید از طریق **Migration Files** اجرا می‌شوند:

```bash
supabase db push
```

این یک دستور انجام می‌دهد:
1. ✅ فایل‌های SQL را خوانده
2. ✅ به Supabase سرور ارسال می‌کند
3. ✅ جداول، اینجکس‌ها، RLS policies را ایجاد می‌کند
4. ✅ تمام کاری را انجام می‌دهد

---

## 📁 معماری Migration Files

### فایل‌های Migration (3 فایل)

```
supabase/migrations/
│
├── 20251128_phase1_extended_tasks.sql
│   └── 3 جدول جدید (task_labels, task_label_links, subtasks)
│
├── 20251129_phase2_workspaces_rbac.sql
│   └── 5 جدول + RLS policies + Triggers
│
└── 20251130_phase3_templates_recurring.sql
    └── 5 جدول + SQL Functions
```

### نام‌گذاری فایل‌ها

```
YYYYMMDD_description_name.sql
│        │                 │
│        │                 └─ نام خوانا (انگلیسی)
│        └─────────────────── توضیح
└────────────────────────────── تاریخ اجرا
```

**مثال:**
- `20251128` = تاریخ (28 نوامبر 2025)
- `phase1_extended_tasks` = نام مرحله

---

## 🔄 چگونه جریان کار می‌کند

### مرحله ۱: Supabase CLI شما را متصل می‌کند

```bash
$ supabase link --project-ref qkiexuabetcejvbpztje
```

**نتیجه:** اتصال برقرار می‌شود ↔️ Cloud Supabase

### مرحله ۲: فایل‌های محلی بررسی می‌شوند

```bash
$ supabase db push
```

**بررسی می‌کند:**
- کدام فایل‌های SQL جدید هستند؟
- کدام‌ها قبلاً اجرا شده‌اند؟
- چه فایل‌هایی pending هستند؟

### مرحله ۳: فایل‌ها به سرور ارسال می‌شوند

```
Local Files     →    HTTPS    →    Supabase Server
.sql files              │           (Cloud)
                   Encrypted
```

### مرحله ۴: SQL دستورات اجرا می‌شوند

```sql
-- آنچه در Supabase اجرا می‌شود:

CREATE TABLE task_labels (...)
CREATE TABLE task_label_links (...)
CREATE TABLE subtasks (...)
CREATE INDEX idx_tasks_due_date ON tasks(due_date)
...
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY
CREATE POLICY "..." ON tasks
...
```

### مرحله ۵: نتیجه

```
✅ جداول جدید در Supabase
✅ Realtime enabled
✅ RLS policies فعال
✅ API ready to use
```

---

## 💾 مثال عملی: Phase 1

### فایل: `20251128_phase1_extended_tasks.sql`

```sql
-- ۱. جدول برچسب‌ها ایجاد شود
CREATE TABLE task_labels (
  id uuid primary key,
  name text,
  color text,
  ...
);

-- ۲. جدول ارتباط ایجاد شود
CREATE TABLE task_label_links (
  task_id bigint references tasks(id),
  label_id uuid references task_labels(id),
  ...
);

-- ۳. جدول زیرمجموعه‌ها ایجاد شود
CREATE TABLE subtasks (
  id uuid primary key,
  task_id bigint references tasks(id),
  title text,
  completed boolean,
  ...
);

-- ۴. اینجکس برای سرعت
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ۵. فیلدهای جدید به tasks اضافه شوند
ALTER TABLE tasks ADD COLUMN due_date date;
ALTER TABLE tasks ADD COLUMN description text;
```

**وقتی `supabase db push` اجرا شود:**
- ✅ `task_labels` جدول ایجاد می‌شود
- ✅ `task_label_links` جدول ایجاد می‌شود
- ✅ `subtasks` جدول ایجاد می‌شود
- ✅ اینجکس‌ها ایجاد می‌شوند
- ✅ Columns جدید اضافه می‌شوند

---

## 🔐 چگونه RLS (امنیت) اضافه می‌شود

### مثال: RLS برای Workspaces

```sql
-- Policy: کاربر فقط workspaces خود را ببیند
CREATE POLICY "users can view workspaces they're members of" 
ON workspaces
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM workspace_members 
    WHERE workspace_id = workspaces.id
  )
);
```

**اثر:**
- کاربر A فقط workspaces A را می‌بیند
- کاربر B فقط workspaces B را می‌بیند
- هیچ cross-access وجود ندارد

---

## 📊 جداول بعد از Migrations

### قبل (1 جدول):
```
├── profiles
└── tasks
```

### بعد (15 جدول):
```
├── profiles
├── tasks (extended)
├── task_labels
├── task_label_links
├── subtasks
├── workspaces
├── workspace_members
├── boards
├── board_columns
├── activity_logs
├── task_templates
├── recurring_task_instances
├── task_dependencies
├── task_time_logs
└── cron_logs
```

---

## 🚀 دستورات Supabase

### ورود (یک‌بار)
```bash
supabase login
```
صفحه مرورگر باز می‌شود → وارد شوید

### اتصال (یک‌بار)
```bash
supabase link --project-ref qkiexuabetcejvbpztje
```

### اجرای Migrations
```bash
supabase db push
```

### پیش‌نمایش (بدون تغییر)
```bash
supabase db push --dry-run
```

### بررسی وضعیت
```bash
supabase db status
```

### دانلود تغییرات
```bash
supabase db pull
```

---

## 🛠️ مثال عملی: اجرای کامل

### مرحله ۱: Terminal باز کنید
```powershell
cd c:\VsProject\taskbotDashboard
```

### مرحله ۲: اتصال
```bash
supabase link --project-ref qkiexuabetcejvbpztje
```

### مرحله ۳: پیش‌نمایش
```bash
supabase db push --dry-run

Output:
Pending migrations:
  [1/3] 20251128_phase1_extended_tasks.sql
  [2/3] 20251129_phase2_workspaces_rbac.sql
  [3/3] 20251130_phase3_templates_recurring.sql
```

### مرحله ۴: اجرا
```bash
supabase db push

Output:
Ready to apply 3 migrations. Continue? (y/n)
y
✓ Phase 1 applied
✓ Phase 2 applied
✓ Phase 3 applied
✅ Database synchronized successfully
```

### مرحله ۵: بررسی
```sql
-- Supabase Dashboard SQL Editor میں:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

Result:
activity_logs
board_columns
boards
profiles
recurring_task_instances
subtasks
task_dependencies
task_label_links
task_labels
task_templates
task_time_logs
tasks
workspaces
workspace_members
```

---

## ⚠️ اهم نکات

### ✅ Migration ها Immutable هستند
```
یک بار اجرا شدند → نمی‌تونند تغییر کنند
برای تغییر → migration جدید بسازید
```

### ✅ فایل‌ها تاریخ‌دار هستند
```
۲۰۲۵۱۱۲۸ (جدیدتر) → اجرا شود
۲۰۲۵۱۱۲۹ (جدیدتر) → بعد اجرا شود
۲۰۲۵۱۱۳۰ (جدیدتر) → آخر اجرا شود
```

### ✅ Realtime خودکار فعال است
```
جداول جدید → خودکار realtime
= Frontend اطلاعات live دریافت می‌کند
```

### ✅ بدون Downtime
```
Existing data → محفوظ می‌ماند
API → کار می‌کند
Users → متوجه نمی‌شوند
```

---

## 📱 API استفاده از جداول جدید

### بعد از Migrations:

```typescript
// Task با برچسب اضافه کنید
const { data } = await supabase
  .from('task_label_links')
  .insert({ task_id: 1, label_id: 'uuid' })

// Workspace بسازید
const { data } = await supabase
  .from('workspaces')
  .insert({ name: 'تیم', owner_id: 'user-uuid' })

// وظیفه تکراری ایجاد کنید
const { data } = await supabase
  .from('tasks')
  .insert({
    title: 'کار روزانه',
    is_recurring: true,
    recurrence_rule: 'daily'
  })
```

---

## 🎓 خلاصه

| سوال | جواب |
|------|------|
| **جداول کجا تعریف می‌شوند?** | `supabase/migrations/*.sql` |
| **چگونه اجرا می‌شوند?** | `supabase db push` |
| **کدام جداول جدیدند?** | 14 جدول (بدون originals) |
| **چقدر طول می‌کشد?** | ~4 دقیقه |
| **Downtime هست؟** | خیر، بدون downtime |
| **می‌تونم rollback کنم؟** | بله، migration جدید برای rollback |
| **RLS خودکار؟** | بله، migrations شامل RLS |
| **API فوری کار می‌کند؟** | بله، بعد از migration |

---

## 🆘 سوالات عام

### س: اگر خطا رخ داد؟
**ج:** 
```bash
supabase db pull          # تغییرات دانلود کن
supabase db push          # دوباره سعی کن
```

### س: چطور می‌فهمم جداول ایجاد شدند؟
**ج:** Dashboard → SQL Editor:
```sql
SELECT * FROM information_schema.tables;
```

### س: می‌تونم migration را حذف کنم؟
**ج:** خیر! فایل‌های اجرا شده immutable هستند.

### س: اگر forget کردم migration push کنم؟
**ج:** `supabase db push` دوباره آن را detect می‌کند.

---

## 🎉 نتیجه

**جداول جدید در Supabase:**
- ✅ 14 جدول + 15 اندکس
