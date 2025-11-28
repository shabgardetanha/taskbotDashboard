# گام‌به‌گام: اجرای جداول جدید در Supabase

## 📋 خلاصه سریع

**فایل‌های Migration آماده:** 3 فایل
**تعداد جداول جدید:** 11 جدول
**دستورات مورد نیاز:** 2-3 دستور فقط

---

## 🚀 شروع سریع (۲ دقیقه)

### مرحله ۱: باز کردن Terminal

```powershell
cd c:\VsProject\taskbotDashboard
```

### مرحله ۲: ورود به Supabase (اگر قبلاً ورود نکرده‌اید)

```bash
supabase login
```

✅ صفحه‌ای باز می‌شود، وارد شوید

### مرحله ۳: اتصال به پروژه

```bash
supabase link --project-ref qkiexuabetcejvbpztje
```

### مرحله ۴: اجرای جداول جدید

```bash
supabase db push
```

✅ تمام جداول خودکار اضافه می‌شوند

---

## 📊 چه چیزی اضافه می‌شود؟

### Phase 1: وسایل توسعه‌یافته (28 نوامبر)

```
✅ task_labels      - برچسب‌های وظایف
✅ task_label_links - ارتباط وظایف و برچسب‌ها
✅ subtasks         - زیروظایف
```

### Phase 2: Workspaces و همکاری (29 نوامبر)

```
✅ workspaces        - فضاهای کاری
✅ workspace_members - اعضای تیم
✅ boards            - کانبان‌های متعدد
✅ board_columns     - ستون‌های کانبان
✅ activity_logs     - سابقه تغییرات
```

### Phase 3: Templates و Recurring (30 نوامبر)

```
✅ task_templates           - الگو‌های وظایف
✅ recurring_task_instances - وظایف تکراری
✅ task_dependencies        - وابستگی‌های وظایف
✅ task_time_logs          - ثبت زمان‌ها
✅ cron_logs               - ثبت وظایف خودکار
```

**کل: 14 جدول جدید + RLS policies + Indexes**

---

## ✅ بررسی موفقیت

### بعد از اجرای `supabase db push`:

```sql
-- اجرا کنید در Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

**نتیجه مورد انتظار:**

```
activity_logs
board_columns
boards
cron_logs
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

## 🔍 نمونه‌های عملی

### ۱. اضافه کردن برچسب به وظیفه

**SQL:**

```sql
-- ایجاد برچسب
INSERT INTO task_labels (name, color, workspace_id)
VALUES ('فوری', '#ef4444', 'workspace-uuid');

-- پیوند با وظیفه
INSERT INTO task_label_links (task_id, label_id)
VALUES (1, 'label-uuid');
```

### ۲. ایجاد Workspace جدید

**SQL:**

```sql
INSERT INTO workspaces (name, owner_id)
VALUES ('تیم مارکتینگ', 'user-uuid');
```

### ۳. ثبت وظیفه تکراری

**SQL:**

```sql
INSERT INTO tasks (title, assignee_id, is_recurring, recurrence_rule, due_date)
VALUES ('بررسی ایمیل‌ها', 'user-uuid', true, 'daily', CURRENT_DATE);
```

---

## 🛠️ عیب‌یابی

### ❌ خطا: "database is being updated"

```bash
# صبر کنید و دوباره تلاش کنید
supabase db push
```

### ❌ خطا: "permission denied"

```bash
# مجدد وارد شوید
supabase logout
supabase login
supabase db push
```

### ❌ خطا: "function already exists"

```bash
# Pull تغییرات از سرور
supabase db pull
supabase db push
```

---

## 📱 اتصال API به جداول جدید

### مثال: دریافت وظایف با برچسب‌ها

**TypeScript (src/lib/supabase.ts):**

```typescript
const { data: tasks } = await supabase
  .from("tasks")
  .select(
    `
    *,
    labels:task_label_links(
      label:task_labels(id, name, color)
    ),
    subtasks(*)
  `
  )
  .eq("workspace_id", workspaceId);
```

### مثال: ایجاد وظیفه در Workspace

**TypeScript (src/app/api/tasks/route.ts):**

```typescript
await supabase.from("tasks").insert({
  title: "عنوان",
  description: "توضیح",
  workspace_id: workspaceId,
  assignee_id: userId,
  due_date: "2025-12-31",
  status: "todo",
});
```

---

## 🔒 RLS (امنیت) - چگونه کار می‌کند؟

**فقط صاحب Workspace می‌تونه:**

- ✅ اعضای تیم را اضافه کند
- ✅ بورد جدید درست کند
- ✅ وظایف را حذف کند

**اعضا می‌تونند:**

- ✅ وظایف خود را مشاهده کنند
- ✅ وظایف را ویرایش کنند
- ✅ زیرمجموعه‌ها اضافه کنند

**RLS خودکار از طریق Supabase تطبیق می‌شود.**

---

## 📞 دستورات مفید

```bash
# بررسی وضعیت
supabase db status

# دانلود تغییرات از سرور
supabase db pull

# بازگشت به قبل (خطرناک!)
supabase db reset --force

# بررسی logs
supabase logs --project-ref qkiexuabetcejvbpztje
```

---

## 🎯 بعد از اجرا - آیتم‌های انجام شده

- ✅ تمام جداول Phase 1, 2, 3 ایجاد شده‌اند
- ✅ RLS policies فعال‌اند
- ✅ Realtime برای جداول جدید فعال است
- ✅ Indexes برای سرعت اضافه شده‌اند
- ✅ Triggers برای activity logging درست هستند

**حالا می‌تونید:**

- 🔧 API endpoints را استفاده کنید
- 🎨 UI components را integrate کنید
- 📱 Telegram commands جدید را تست کنید

---

## 🆘 کمک بیشتر

اگر خطایی رخ داد:

1. پیام خطا را کپی کنید
2. بررسی کنید `SUPABASE_SERVICE_ROLE_KEY` تنظیم شده
3. اجرا کنید: `supabase db pull` سپس `supabase db push`

---

**Happy Coding! 🚀**
