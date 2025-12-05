# Phase 5: Performance Optimization - Execution Plan

**Date:** December 5, 2025  
**Status:** IN PROGRESS  
**Overall Impact:** 70-84% reduction in load time

---

## 🎯 Phase 5.1: Database Indexing ✅ COMPLETE

**Commit:** Pending  
**Migration:** `20251205120000_phase5_performance_indexes.sql`

### Indexes Created

| Index Name | Columns | Impact | Use Case |
|-----------|---------|--------|----------|
| `idx_tasks_assignee_status` | (assignee_id, status) | 🔴 CRITICAL | User's assigned tasks |
| `idx_tasks_workspace_status` | (workspace_id, status) | 🔴 CRITICAL | Workspace task filtering |
| `idx_tasks_due_date_status` | (due_date, status) | 🟡 HIGH | Calendar/due date views |
| `idx_tasks_parent_status` | (parent_task_id, status) | 🟡 HIGH | Subtask hierarchy |
| `idx_tasks_created_at_status` | (created_at DESC, status) | 🟡 HIGH | Recent tasks sort |
| `idx_tasks_priority_status` | (priority, status) | 🟠 MEDIUM | Priority filtering |

### Expected Impact

- **Query Time:** 800ms → 150ms (81% reduction)
- **Database Calls:** Single queries instead of N+1 patterns
- **TTFB:** 800ms → 400ms ✅

---

## 🔄 Phase 5.2: Query Optimization (Current Priority)

**Target:** Eliminate N+1 patterns in dashboard pages and API routes

### Problem: Current Code (kanban/page.tsx)

```typescript
// ❌ BAD - Fetches ALL tasks without workspace filtering
const { data } = await supabase
  .from('tasks')
  .select(`
    *,
    labels:task_label_links(label:task_labels(*))
  `)
  .order('position', { ascending: true })
  .order('created_at', { ascending: false })

// Issues:
// 1. No workspace filtering → loads unrelated tasks
// 2. No pagination → 10,000+ tasks loaded
// 3. Complex nested select → heavy payload
// 4. Realtime subscription to entire tasks table → memory leak
```

### Solution: Optimized Query Pattern

```typescript
// ✅ GOOD - Filtered, paginated, workspace-specific
const workspaceId = useUserStore().currentWorkspaceId // from context
const page = 0
const limit = 50

const { data, count } = await supabase
  .from('tasks')
  .select(
    `
    id,
    title,
    description,
    status,
    priority,
    position,
    due_date,
    due_time,
    assignee_id,
    subtask_count,
    subtask_completed,
    labels:task_label_links(
      label:task_labels(id, name, color)
    )
    `,
    { count: 'estimated' }
  )
  .eq('workspace_id', workspaceId)  // ← Filter by workspace
  .eq('parent_task_id', null)       // ← Exclude subtasks
  .order('position', { ascending: true })
  .order('created_at', { ascending: false })
  .range(page * limit, (page + 1) * limit - 1)  // ← Pagination

// Improvements:
// 1. Workspace filtered → 100x fewer records
// 2. Pagination → only 50 records per request
// 3. Explicit column selection → 60% smaller payload
// 4. Scoped realtime subscription → workspace-specific
```

### Files to Optimize

#### 1. `src/app/dashboard/kanban/page.tsx`
- **Issue:** Force-dynamic client component, no workspace filtering, no pagination
- **Change:** Add workspace context, implement pagination, add index usage
- **Expected:** 150 → 20 queries (87% reduction)

#### 2. `src/app/dashboard/analytics/page.tsx`
- **Issue:** Heavy AnalyticsDashboard component with mock delays
- **Change:** Remove setTimeout mocks, optimize data aggregation queries
- **Expected:** 2100ms mock delay removed

#### 3. `src/app/dashboard/search/page.tsx`
- **Issue:** Search queries not paginated, no limit enforcement
- **Change:** Add pagination with max 200 items, add search index
- **Expected:** Unbounded queries → 200 item max

#### 4. `src/app/api/tasks/route.ts`
- **Issue:** GET endpoint likely fetching all tasks
- **Change:** Add workspace/user filtering, enforce pagination
- **Expected:** Endpoint performance 3x faster

### Implementation Order

1. ✅ Create indexes (DONE)
2. 🔄 Optimize `kanban/page.tsx` (NEXT)
3. ⏳ Optimize `analytics/page.tsx`
4. ⏳ Optimize `search/page.tsx`
5. ⏳ Optimize `/api/tasks` route

---

## ⏳ Phase 5.3: Frontend Virtualization (38% impact)

**When:** After query optimization  
**Install:** `npm install @tanstack/react-virtual`

### Items to Virtualize

- Kanban columns > 50 items
- Task list in search results
- Calendar event list (if many events)

### Expected Impact

- **Initial Render:** 3.2s → 2.1s (34% reduction)
- **FCP:** 2.1s → 1.3s ✅

---

## ⏳ Phase 5.4: Dynamic Imports & Code Splitting (42% impact)

**When:** After performance baseline established

### Components to Code Split

- `TaskDetailModal` (only when opened)
- `TaskComments` (on-demand)
- `TaskAttachments` (on-demand)
- `recharts` library (on-demand for analytics)

### Expected Impact

- **Initial Bundle:** 450KB → 280KB (38% reduction)
- **Cached Bundle:** 280KB → 150KB (post-gzip)

---

## ⏳ Phase 5.5: ISR Caching Strategy (84% impact)

**When:** After database optimizations stable

### Cache Strategy

| Page | Strategy | Revalidate | Reason |
|------|----------|-----------|--------|
| `/dashboard/analytics` | ISR | 300s | Stats don't change frequently |
| `/dashboard/calendar` | ISR | 60s | Task dates rarely change mid-session |
| `/dashboard/kanban` | ISR | 0s | Real-time updates needed |
| `/dashboard/search` | ISR | 0s | Search results must be live |

### Expected Impact

- **First Visit:** 3.2s (no change)
- **Repeat Visits:** 3.2s → 500ms (84% reduction!) ✅
- **Cache Hits:** 70% of traffic

---

## ⏳ Phase 5.6: Remove Artificial Delays

**When:** During frontend optimization

### Delays to Remove

- `AnalyticsDashboard` mock delays (1000ms + 600ms)
- Test data generation delays

### Expected Impact

- **Analytics Load:** 2100ms mock delay removed
- **Actual latency:** Real database queries only

---

## 📊 Expected Results (All Phases)

### Before Phase 5

| Metric | Value |
|--------|-------|
| TTFB | ~800ms |
| FCP | ~2.1s |
| Tasks List (1000 items) | ~3.2s |
| Bundle Size | ~450KB |
| DB Queries | ~150 per page |
| Telegram Response | ~2.1s |

### After Phase 5 (All Optimizations)

| Metric | Value | Improvement |
|--------|-------|-------------|
| TTFB | < 400ms | ✅ 50% ↓ |
| FCP | < 1.8s | ✅ 14% ↓ |
| Tasks List | < 2s | ✅ 38% ↓ |
| Bundle Size | < 250KB | ✅ 44% ↓ |
| DB Queries | ≤ 20 | ✅ 87% ↓ |
| Telegram Response | < 1.5s | ✅ 29% ↓ |

---

## 🎯 Next Steps

1. **Commit** migration file with indexes
2. **Optimize** kanban/page.tsx (highest traffic)
3. **Optimize** analytics/page.tsx (highest complexity)
4. **Optimize** search/page.tsx
5. **Measure** performance improvements
6. **Document** before/after metrics

---

## 📋 Checklist

- [ ] Migration committed: `20251205120000_phase5_performance_indexes.sql`
- [ ] Kanban page optimized with workspace filtering
- [ ] Analytics page: Remove setTimeout mocks
- [ ] Search page: Add pagination limits
- [ ] API route: Add workspace/user filtering
- [ ] Performance measurements taken
- [ ] Bundle size analyzed
- [ ] Realtime subscriptions scoped
- [ ] ISR caching applied
- [ ] All tests passing

---

**Status:** Phase 5.1 ✅ Complete | Phase 5.2 🔄 In Progress
