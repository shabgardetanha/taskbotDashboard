# راهنمای اجرای تست‌های TaskBot Persian

## نمای کلی

این مجموعه تست شامل سناریوهای کامل E2E برای برنامه TaskBot Persian است که با استفاده از Playwright TypeScript پیاده‌سازی شده‌اند. تست‌ها شامل سناریوهای Happy Path، Negative Cases و Security Tests می‌باشند.

## پیش‌نیازها

### نرم‌افزارهای مورد نیاز
- Node.js 18+
- npm یا yarn
- Git

### نصب وابستگی‌ها

```bash
# کلون کردن پروژه
git clone <repository-url>
cd taskbotDashboard

# نصب وابستگی‌ها
npm install

# نصب Playwright browsers
npx playwright install
```

### راه‌اندازی محیط تست

```bash
# راه‌اندازی سرور توسعه
npm run dev

# در ترمینال جداگانه، راه‌اندازی دیتابیس (اگر Docker استفاده می‌کنید)
docker-compose up -d

# یا راه‌اندازی Supabase local
npx supabase start
```

## ساختار تست‌ها

```
tests/
├── pages/                    # Page Object Models
│   ├── BasePage.ts          # کلاس پایه برای همه صفحات
│   ├── DashboardPage.ts     # صفحه داشبورد
│   └── KanbanPage.ts        # صفحه کانبان
├── task-management.spec.ts   # تست‌های مدیریت وظایف
├── auth.spec.ts             # تست‌های احراز هویت
├── workspace.spec.ts        # تست‌های مدیریت ورک‌اسپیس
├── security.spec.ts         # تست‌های امنیتی
└── performance.spec.ts      # تست‌های عملکرد
```

## اجرای تست‌ها

### اجرای همه تست‌ها
```bash
npm run test:e2e
```

### اجرای تست‌های خاص
```bash
# اجرای تست‌های مدیریت وظایف
npx playwright test task-management.spec.ts

# اجرای تست‌های امنیتی
npx playwright test security.spec.ts

# اجرای تست‌های عملکرد
npx playwright test performance.spec.ts
```

### اجرای تست‌ها با UI
```bash
# اجرای تست‌ها با رابط کاربری Playwright
npx playwright test --ui
```

### اجرای تست‌ها در مرورگرهای مختلف
```bash
# اجرای در Chromium
npx playwright test --project=chromium

# اجرای در Firefox
npx playwright test --project=firefox

# اجرای در WebKit (Safari)
npx playwright test --project=webkit
```

### اجرای تست‌ها در محیط headless
```bash
npx playwright test --headed
```

## تنظیمات تست

### فایل playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## سناریوهای تست پیاده‌سازی شده

### ✅ Task Management (مدیریت وظایف)
- **Happy Path**: ایجاد، ویرایش، حذف، انتقال وظایف
- **Negative Cases**: اعتبارسنجی ورودی‌ها، کاراکترهای خاص
- **Security**: XSS، SQL Injection، IDOR

### ✅ Kanban System (سیستم کانبان)
- **Happy Path**: drag & drop، فیلترها، آمار ستون‌ها
- **Edge Cases**: تعداد زیاد وظایف، عملکرد موبایل
- **Race Conditions**: بروزرسانی همزمان

### 🔄 Authentication (احراز هویت)
- **Login/Logout**: سناریوهای مختلف ورود
- **Security**: brute force protection، password strength

### 🔄 Workspace Management (مدیریت ورک‌اسپیس)
- **CRUD Operations**: ایجاد، ویرایش، حذف ورک‌اسپیس
- **Access Control**: نقش‌ها و مجوزها

### 🔄 Telegram Integration (ادغام با تلگرام)
- **Bot Commands**: پاسخگویی به دستورات
- **Webhooks**: دریافت پیام‌ها

### 🔄 Advanced Search (جستجوی پیشرفته)
- **Filters**: جستجو بر اساس معیارهای مختلف
- **Performance**: handling نتایج زیاد

## گزارش‌گیری

### گزارش HTML
```bash
npx playwright show-report
```

### گزارش JSON
```bash
PLAYWRIGHT_JSON_OUTPUT_NAME=results.json npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

## اسکرین‌شات‌ها و ویدیوها

- **اسکرین‌شات‌ها**: در `tests/screenshots/` ذخیره می‌شوند
- **ویدیوها**: در صورت failure در `test-results/` ذخیره می‌شوند
- **Traces**: برای debugging در `test-results/` ذخیره می‌شوند

## متغیرهای محیطی

```bash
# کپی فایل نمونه
cp .env.local .env.test

# تنظیم متغیرها
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_anon_key
TELEGRAM_BOT_TOKEN=your_test_bot_token
```

## CI/CD Integration

### GitHub Actions مثال
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## عیب‌یابی

### مشکلات رایج

#### 1. Browsers نصب نشده
```bash
npx playwright install --force
```

#### 2. Port conflict
```bash
# تغییر port در package.json
"dev": "next dev -p 3001"
```

#### 3. Database connection
```bash
# بررسی اتصال به Supabase
npx supabase status
```

#### 4. Timeout errors
```bash
# افزایش timeout در playwright.config.ts
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

## معیارهای کیفیت

### Coverage Targets
- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: همه API endpoints
- **E2E Tests**: critical user journeys

### Performance Benchmarks
- **Page Load**: < 2 seconds
- **API Response**: < 500ms
- **Test Execution**: < 10 minutes برای full suite

## پشتیبانی و نگهداری

### اضافه کردن تست جدید
1. ایجاد فایل تست در `tests/`
2. پیروی از Page Object Model
3. اضافه کردن به CI pipeline
4. بروزرسانی این README

### بروزرسانی Page Objects
- تغییرات UI را در Page Objects منعکس کنید
- تست‌های مرتبط را اجرا کنید
- اسکرین‌شات‌ها را بروز کنید

## باگ‌ها و مشکلات کشف شده

### High Priority
- [ ] API rate limiting پیاده‌سازی نشده
- [ ] Input validation در frontend ضعیف
- [ ] Session management نیاز به بهبود

### Medium Priority
- [ ] Memory leaks در کامپوننت‌های real-time
- [ ] Error handling ناقص در edge cases

### Low Priority
- [ ] Performance optimization در لیست وظایف
- [ ] Accessibility improvements

## نتیجه‌گیری

این مجموعه تست پوشش کاملی از عملکرد برنامه TaskBot Persian ارائه می‌دهد. برای اجرای موفق تست‌ها، اطمینان حاصل کنید که تمام پیش‌نیازها نصب و تنظیم شده‌اند.

برای سوالات بیشتر با تیم QA تماس بگیرید.
