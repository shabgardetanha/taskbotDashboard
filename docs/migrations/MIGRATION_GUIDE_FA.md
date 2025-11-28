# راهنمای اجرای Migrations در Supabase

## ۱. پیش‌نیازها

### الف) نصب Supabase CLI

```bash
npm install -g supabase
```

### ب) ورود به حساب Supabase

```bash
supabase login
```

- یک صفحه مرورگر باز می‌شود
- وارد شوید یا ثبت نام کنید
- توکن را کپی کنید

---

## ۲. اتصال به پروژه

داخل پوشه پروژه:

```bash
cd c:\VsProject\taskbotDashboard
supabase link --project-ref qkiexuabetcejvbpztje
```

**پروژه‌ریف:** `qkiexuabetcejvbpztje` (از `Note.md`)

---

## ۳. اجرای Migrations

### روش اول: اجرای کلی (توصیه شده)

```bash
supabase db push
```

**این دستور:**

- تمام فایل‌های SQL در `supabase/migrations/` را خوانده
- فایل‌های جدید (Pending) را شناسایی می‌کند
- برای تایید می‌پرسد
- تمام جداول و RLS policies را اضافه می‌کند

### روش دوم: اجرای اختیاری

```bash
supabase db push --dry-run  # فقط پیش‌نمایش
```

---

## ۴. چه فایل‌های Migration برای اجرا آماده هستند؟

فایل‌های زیر در `supabase/migrations/` موجود‌اند:

### Phase 1: توسعه سیستم وظایف (۲۸ نوامبر)

📄 **۲۰۲۵۱۱۲۸_phase1_extended_tasks.sql**

- فیلدهای جدید: `due_date`, `due_time`, `description`
- جداول: `task_labels`, `task_label_links`, `subtasks`
- اینجدکس‌های سرعت

### Phase 2: Workspaces و همکاری (۲۹ نوامبر)

📄 **۲۰۲۵۱۱۲۹_phase2_workspaces_rbac.sql**

- جداول: `workspaces`, `workspace_members`, `boards`, `board_columns`, `activity_logs`
- RLS policies برای کنترل دسترسی
- Triggers برای ثبت تغییرات

### Phase 3: Templates و Recurring Tasks (۳۰ نوامبر)

📄 **۲۰۲۵۱۱۳۰_phase3_templates_recurring.sql**

- جداول: `task_templates`, `recurring_task_instances`, `task_dependencies`, `task_time_logs`
- SQL functions برای تولید وظایف تکراری

---

## ۵. مراحل دقیق اجرا

### مرحله ۱: بررسی فایل‌های Migration

```bash
ls supabase/migrations/
```

باید این فایل‌ها را ببینید:

- ✅ `20251128_phase1_extended_tasks.sql`
- ✅ `20251129_phase2_workspaces_rbac.sql`
- ✅ `20251130_phase3_templates_recurring.sql`

### مرحله ۲: اتصال دوباره (اگر قبلاً انجام نشده)

```bash
supabase link --project-ref qkiexuabetcejvbpztje
```

### مرحله ۳: اجرای Migrations

```bash
supabase db push
```

**خروجی:**

```
Connecting to remote database...
Pulling remote schema...
Applying migrations:

  [1/3] Phase 1: Extended tasks (20251128_phase1_extended_tasks.sql)
  [2/3] Phase 2: Workspaces & RBAC (20251129_phase2_workspaces_rbac.sql)
  [3/3] Phase 3: Templates & Recurring (20251130_phase3_templates_recurring.sql)

✓ Database synchronized successfully
```

---

## ۶. بررسی جداول در Supabase Dashboard

1. برو به https://supabase.com/dashboard
2. پروژه `TaskBot` را انتخاب کن
3. برو به **SQL Editor**
4. اجرای query:

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

**جداول مورد انتظار:**

- profiles ✅
- tasks ✅
- task_labels ✅
- task_label_links ✅
- subtasks ✅
- workspaces ✅
- workspace_members ✅
- boards ✅
- board_columns ✅
- activity_logs ✅
- task_templates ✅
- recurring_task_instances ✅
- task_dependencies ✅
- task_time_logs ✅
- cron_logs ✅

---

## ۷. تست RLS Policies

```sql
-- تست اینکه فقط صاحب وظیفه می‌تونه ببینه
SELECT * FROM tasks WHERE workspace_id = 'YOUR_WORKSPACE_ID';
```

اگر RLS صحیح کار کنه، فقط وظایفی نمایش داده می‌شه که مالک باشید.

---

## ۸. در صورت خطا

### خطا: "FATAL: remaining connection slots reserved for non-replication superuser connections"

- Supabase سرور مشغول است
- ۱۰ ثانیه صبر کنید و دوباره تلاش کنید

### خطا: "Permission denied"

- بررسی کنید `SUPABASE_SERVICE_ROLE_KEY` در `.env` تنظیم شده
- یا مجدد login کنید: `supabase login`

### خطا: "Migration already applied"

- دستور `supabase db pull` اجرا کنید
- سپس `supabase db push`

---

## ۹. بعد از اجرا موفق

✅ جداول جدید در Supabase ایجاد شدند
✅ RLS policies فعال هستند
✅ Realtime برای جداول جدید فعال است
✅ API endpoints می‌توانند اطلاعات جدید استفاده کنند

---

## ۱۰. دستورات مفید

```bash
# بررسی وضعیت migrations
supabase db status

# دانلود schema از سرور
supabase db pull

# پاک کردن تمام جداول (خطرناک!)
supabase db reset

# بازگشت به حالت قبلی
supabase db push --dry-run
```

---

## نکات مهم

⚠️ **هرگز env secrets را commit نکنید**

- `SUPABASE_SERVICE_ROLE_KEY` فقط در `.env.local`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` می‌تونه عمومی باشه

✅ **Migrations همیشه immutable هستند**

- نمی‌تونید migration قدیم را تغییر دهید
- یک migration جدید برای rollback درست کنید

✅ **بعد از هر migration، برنامه را restart کنید**

```bash
npm run dev
```

---

اگر سوالی دارید، من کمک کنم! 🚀
