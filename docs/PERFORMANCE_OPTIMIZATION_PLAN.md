# 📈 برنامه بهینه‌سازی عملکرد TaskBot Persian

## 🎯 اهداف

- **Bundle Size**: 500KB → 250KB (-50%)
- **Initial Load**: 3.2s → 1.5s (-53%)
- **API Queries**: 150 → 20 (-87%)
- **Time to Interactive**: 2.8s → 1.2s (-57%)

---

## 🔧 اولویت 1: حذف Dead Code (2-3 ساعت)

### ❌ فایل‌های برای حذف:

1. **src/components/AnalyticsDashboard.tsx** (539 خط)

   - Duplicate logic in `/dashboard/analytics/page.tsx`
   - Never imported anywhere
   - Remove and consolidate

2. **src/components/NotificationsDropdown.tsx** (346 خط)

   - No consumer component
   - Features can be added later
   - Remove

3. **src/components/TaskFilters.tsx** (225 خط)

   - Search and Kanban have own filters
   - Remove or integrate

4. **src/hooks/useAccessibility.ts** (200 خط)
   - Partial implementation
   - Not integrated with UI
   - Remove unused functions

### 📊 نتیجه انتظاری:

```
Current: 1,310 خط dead code
After cleanup: 0 خط
Bundle reduction: ~80KB
Parsing time: -200ms
```

---

## 🔧 اولویت 2: بهینه‌سازی دیتابیس (3-4 ساعت)

### ❌ مسئله: N+1 Query Pattern

**موارد:**

- Dashboard analytics page - query 100+ tasks
- Kanban board - query all tasks with labels
- Search results - fetch tasks + labels separately

### ✅ راهکار: GraphQL-style Joins

```typescript
// ❌ Before (N+1)
const { data: tasks } = await supabase.from("tasks").select("*");

// ✅ After (Single query with joins)
const { data: tasks } = await supabase
  .from("tasks")
  .select(
    `
    *,
    task_labels:task_label_links(label:task_labels(*)),
    comments(count),
    attachments(count),
    subtasks(count)
  `
  )
  .limit(50); // Pagination
```

### 🗂️ فایل‌های مؤثر:

1. `src/app/dashboard/kanban/page.tsx` - Line 60-80
2. `src/app/dashboard/search/page.tsx` - Line 75-110
3. `src/app/dashboard/analytics/page.tsx` - Line 47-70
4. `src/app/dashboard/calendar/page.tsx` - Line 40-70

### 📊 نتیجه انتظاری:

```
Queries: 150 → 20 (-87%)
Response time: 2.3s → 400ms (-83%)
```

---

## 🔧 اولویت 3: Enable Dynamic Caching (1-2 ساعت)

### ❌ مسئله: force-dynamic برای همه صفحات

```typescript
// ❌ Current - No caching
export const dynamic = "force-dynamic";
```

### ✅ راهکار: Strategic Caching

```typescript
// ✅ After - Cache + ISR
export const revalidate = 60; // Revalidate every 60s
```

### 🗂️ صفحات:

1. `src/app/dashboard/analytics/page.tsx` - revalidate: 300
2. `src/app/dashboard/calendar/page.tsx` - revalidate: 60
3. `src/app/dashboard/templates/page.tsx` - revalidate: 300
4. `src/app/dashboard/search/page.tsx` - revalidate: 0 (keep dynamic)
5. `src/app/webapp/page.tsx` - revalidate: 30

### 📊 نتیجه انتظاری:

```
Repeat visits: 3.2s → 500ms (-84%)
Server load: 150 req/min → 30 req/min (-80%)
```

---

## 🔧 اولویت 4: Dynamic Imports (1 ساعت)

### ✅ راهکار: Split Heavy Components

```typescript
import dynamic from "next/dynamic";

// Heavy components - load on demand
const AnalyticsDashboard = dynamic(
  () => import("@/components/AnalyticsDashboard"),
  { loading: () => <LoadingSkeleton /> }
);

const TaskDetailModal = dynamic(() => import("@/components/TaskDetailModal"), {
  ssr: false,
});
```

### 🗂️ کمپوننت‌های برای dynamic import:

1. `TaskDetailModal.tsx` (500+ lines)
2. `TaskComments.tsx` (300+ lines)
3. `TaskAttachments.tsx` (200+ lines)
4. Charts/Analytics components
5. Recharts library (180KB)

### 📊 نتیجه انتظاری:

```
Initial JS: 450KB → 280KB (-38%)
First Contentful Paint: 2.1s → 1.3s (-38%)
```

---

## 🔧 اولویت 5: Remove Artificial Delays (30 دقیقه)

### ❌ موارد:

**src/components/AnalyticsDashboard.tsx:126**

```typescript
await new Promise((resolve) => setTimeout(resolve, 1000));
```

**src/app/dashboard/analytics/page.tsx:**
Mock data with simulated delays

### ✅ راهکار:

Remove simulation delays - use real API calls

### 📊 نتیجه انتظاری:

```
Analytics page: 2.5s → 800ms (-68%)
```

---

## 🔧 اولویت 6: Dependency Optimization (1 ساعت)

### 📦 Heavy Dependencies:

| Package           | Size  | Usage            | Status                 |
| ----------------- | ----- | ---------------- | ---------------------- |
| **recharts**      | 180KB | Analytics only   | ✅ Dynamic import      |
| **framer-motion** | 60KB  | Animations       | ✅ Keep (critical UX)  |
| **telegraf**      | 90KB  | Server-side only | ✅ OK                  |
| **@dnd-kit**      | 40KB  | Kanban           | ✅ Keep (core feature) |
| **luxon**         | 80KB  | Unused!          | ❌ Remove              |

### ✅ Action Items:

1. Remove unused `luxon` dependency
2. Move `recharts` to dynamic import
3. Tree-shake unused Radix UI components

### 📊 نتیجه انتظاری:

```
Dependencies: 67 → 55 (-18%)
Bundle size: 450KB → 340KB (-24%)
```

---

## 📋 Implementation Checklist

### Phase 1: Code Cleanup (2-3 hours)

- [ ] Remove `AnalyticsDashboard.tsx`
- [ ] Remove `NotificationsDropdown.tsx`
- [ ] Remove/integrate `TaskFilters.tsx`
- [ ] Clean `useAccessibility.ts`
- [ ] Test all pages still work

### Phase 2: Database Optimization (3-4 hours)

- [ ] Update `kanban/page.tsx` queries
- [ ] Update `search/page.tsx` queries
- [ ] Update `analytics/page.tsx` queries
- [ ] Update `calendar/page.tsx` queries
- [ ] Benchmark query performance

### Phase 3: Caching Strategy (1-2 hours)

- [ ] Replace `force-dynamic` with `revalidate`
- [ ] Configure ISR for each page
- [ ] Test cache invalidation
- [ ] Monitor cache hit rates

### Phase 4: Code Splitting (1 hour)

- [ ] Dynamic import heavy components
- [ ] Dynamic import charts library
- [ ] Test lazy loading
- [ ] Verify bundle sizes

### Phase 5: Cleanup (30 minutes)

- [ ] Remove artificial delays
- [ ] Remove mock data
- [ ] Remove debug logs
- [ ] Final testing

---

## 📊 Expected Results

### Before Optimization:

```
Bundle Size:        450KB
Initial Load:       3.2s
Time to Interactive: 2.8s
API Queries/min:    150
Performance Score:  45/100
```

### After Optimization:

```
Bundle Size:        250KB ↓ -44%
Initial Load:       1.5s ↓ -53%
Time to Interactive: 1.2s ↓ -57%
API Queries/min:    20  ↓ -87%
Performance Score:  85/100 ↑ +89%
```

---

## 🔗 Reference Links

- **Next.js Optimization**: https://nextjs.org/docs/app/building-your-application/optimizing
- **React Query Performance**: https://tanstack.com/query/latest/docs/react/performance
- **Bundle Analysis**: `npx next/bundle-analyzer`
- **Lighthouse**: chrome://inspect

---

## 📝 Notes

- Implement phases sequentially
- Test after each phase
- Monitor metrics with Vercel Analytics
- Create performance budget: 300KB JS, 1.5s LCP
- Regular profiling with React DevTools Profiler
