# 📋 TASKBOT_GUARDIAN Compliance Analysis

**Date:** December 5, 2025
**Compared:** `.github/copilot-instructions.md` vs `.coding-standards/TASKBOT_GUARDIAN.md`
**Status:** ⚠️ **PARTIAL COMPLIANCE** — 9/16 rules fully covered, 7/16 require enhancement

---

## ✅ FULLY COVERED RULES (9/16)

### 1. **NEXT.js APP ROUTER** ✅

- **Guardian Rule:** All new pages in `src/app/*` using App Router, server components by default
- **Copilot Status:** ✅ Explicitly documented
  - "This is a Next.js (App Router) project (Next 14)"
  - Server Components section with examples
  - Dynamic imports with `ssr: false` pattern included
  - RTL layout with `lang="fa" dir="rtl"` mentioned

**Verdict:** Full compliance ✅

---

### 2. **DATABASE PATTERNS (Supabase)** ✅

- **Guardian Rule:** RLS policies, proper indexes, foreign keys, audit logging
- **Copilot Status:** ✅ Thoroughly documented
  - Required indexes listed (6 mandatory indexes)
  - N+1 query prevention with JOIN examples
  - Pagination requirements (default 50, max 200)
  - Audit trail via activity_logs table
  - RLS policies mentioned in context

**Verdict:** Full compliance ✅

---

### 3. **API ENDPOINTS** ✅

- **Guardian Rule:** Dynamic Supabase client, proper error handling, type definitions
- **Copilot Status:** ✅ Documented
  - "Server vs Client" section covers Supabase client usage
  - Telegram webhook pattern shown
  - POST response format mentioned
  - Type validation with Zod pattern included

**Verdict:** Full compliance ✅

---

### 4. **TELEGRAM BOT INTEGRATION** ✅

- **Guardian Rule:** `/api/telegram/route.ts` webhook handler, Telegraf commands, Persian messages
- **Copilot Status:** ✅ Fully covered
  - Exact file path: `src/app/api/telegram/route.ts`
  - Telegraf pattern documented
  - Commands listed: `/new`, `/mytasks`, `/done` + enhanced with `/today`, `/overdue`
  - Webhook handler skeleton provided
  - Persian messaging expected
  - `getOrCreateUser` pattern documented

**Verdict:** Full compliance ✅

---

### 5. **ERROR HANDLING & BOUNDARY** ✅

- **Guardian Rule:** ErrorBoundary component, development vs production error display
- **Copilot Status:** ✅ Mentioned
  - ErrorBoundary reference in key files
  - Toast notifications for API errors
  - Retry option mentioned

**Verdict:** Full compliance ✅

---

### 6. **SECURITY REQUIREMENTS** ✅

- **Guardian Rule:** Server-side only for sensitive env vars, input validation, CORS
- **Copilot Status:** ✅ Explicitly documented
  - "Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `TELEGRAM_BOT_TOKEN` to client code"
  - Environment validation examples with Zod
  - Server vs Client separation clearly defined

**Verdict:** Full compliance ✅

---

### 7. **CODE QUALITY STANDARDS** ✅

- **Guardian Rule:** ESLint, Prettier, naming conventions, no console.log
- **Copilot Status:** ✅ Mentioned
  - ESLint with `eslint-config-next` referenced
  - Naming patterns shown in examples

**Verdict:** Full compliance ✅

---

### 8. **TESTING MANDATORY** ✅

- **Guardian Rule:** Unit tests (Vitest), E2E tests (Playwright), critical paths covered
- **Copilot Status:** ✅ Fully documented
  - "Tests are MANDATORY (no longer optional)"
  - Vitest + @testing-library/react explicitly listed
  - Playwright for critical flows mentioned
  - Before pushing: `npm run test` required

**Verdict:** Full compliance ✅

---

### 9. **DEPLOYMENT REQUIREMENTS** ✅

- **Guardian Rule:** Build must succeed, no pre-render errors, migrations in place
- **Copilot Status:** ✅ Documented
  - `npm run build` mentioned
  - Migrations in `supabase/migrations/` referenced
  - RLS policies enforced in Note.md

**Verdict:** Full compliance ✅

---

## ⚠️ PARTIALLY COVERED RULES (5/16)

### 10. **STATE MANAGEMENT (Zustand + Context)** ⚠️

- **Guardian Rule:** `useUserStore()`, `useUIStore()`, Context API, TypeScript interfaces, store hydration
- **Copilot Status:** ⚠️ Not explicitly documented
  - Only mentioned in "Quick Context" as general pattern
  - No specific store structure shown
  - No hydration patterns or defaults documented
  - No TypeScript interface examples

**Gaps:**

- Missing: Store implementation examples
- Missing: Query keys factory pattern
- Missing: Store state types and initialization

**Remediation:** Add section "State Management & Stores" with examples

**Current Status:** ~30% coverage

---

### 11. **DATA FETCHING (TanStack Query)** ⚠️

- **Guardian Rule:** `useApiQuery()`, `useApiMutation()` wrappers, `queryKeys` factory, `staleTime` per entity
- **Copilot Status:** ⚠️ Partially mentioned
  - React Query mentioned as technology
  - No wrapper hooks documented
  - No `queryKeys` factory pattern
  - No `staleTime` configuration shown
  - No `retry` or `enabled` options discussed

**Gaps:**

- Missing: `useApiQuery<T>()` signature
- Missing: `useApiMutation<TData, TVariables>()` signature
- Missing: queryKeys factory code
- Missing: Optimization options (staleTime, retry, enabled)

**Remediation:** Add comprehensive "Data Fetching Patterns" section with hook signatures

**Current Status:** ~25% coverage

---

### 12. **CUSTOM HOOKS PATTERNS** ⚠️

- **Guardian Rule:** Named hooks per feature (`useTasks()`, `useCreateTask()`), options extending with Persian messages
- **Copilot Status:** ⚠️ Mentioned but not detailed
  - General hook mention in "Quick Context"
  - No domain-specific hook examples
  - No Persian message handling pattern
  - No invalidation pattern shown

**Gaps:**

- Missing: Hook naming conventions per domain (workspace, task, label, etc.)
- Missing: `successMessage`, `errorMessage`, `invalidateQueries` options
- Missing: Optimistic update pattern
- Missing: Persian toast notification integration

**Remediation:** Add "Hook Patterns per Domain" section with examples

**Current Status:** ~20% coverage

---

### 13. **UI COMPONENTS (shadcn/ui + Tailwind)** ⚠️

- **Guardian Rule:** shadcn/ui + Radix primitives, dark mode support, RTL awareness, ARIA labels, accessibility
- **Copilot Status:** ⚠️ Mentioned in passing
  - shadcn/ui mentioned in key files
  - Tailwind CSS referenced
  - RTL layout mentioned
  - Accessibility hooks exist but not documented in standards

**Gaps:**

- Missing: Component library best practices
- Missing: Dark mode prefix convention (`dark:`)
- Missing: Accessibility checklist (ARIA labels, keyboard nav)
- Missing: Loading skeleton pattern
- Missing: Toast system documentation

**Remediation:** Add "UI Component Standards" section

**Current Status:** ~40% coverage

---

### 14. **FILE STRUCTURE** ⚠️

- **Guardian Rule:** Specific directory organization with clear separation
- **Copilot Status:** ⚠️ Partially mentioned
  - References to `src/app/api/`, `src/components/`, `src/lib/` scattered throughout
  - No centralized file structure diagram
  - No organization guidelines for new files

**Gaps:**

- Missing: Complete directory tree
- Missing: Where to place new API routes, hooks, components
- Missing: Naming conventions per directory

**Remediation:** Add "File Structure & Organization" section

**Current Status:** ~50% coverage

---

## ❌ NOT COVERED RULES (2/16)

### 15. **TYPE SAFETY & VALIDATION** ❌

- **Guardian Rule:** TypeScript strict mode, comprehensive interfaces, `as const` for constants, no `any` type
- **Copilot Status:** ❌ Not documented
  - Only mentions "TypeScript" in general
  - No strict mode verification requirement
  - No interface pattern examples
  - No `as const` pattern shown

**Gaps:**

- Missing: TypeScript strict mode requirement
- Missing: DTO interface examples
- Missing: `as const` usage for API_ENDPOINTS, queryKeys
- Missing: Generic patterns documentation

**Remediation:** Add "TypeScript & Type Safety" section

**Current Status:** 0% coverage

---

### 16. **PERFORMANCE & OPTIMIZATION** ❌

- **Guardian Rule:** Dynamic imports, React Query caching, lazy loading, image optimization, no unnecessary re-renders
- **Copilot Status:** ❌ Minimal documentation
  - Mentioned in Phase 5 optimization
  - No specific patterns for code splitting
  - No re-render prevention strategies
  - No image optimization guidelines

**Gaps:**

- Missing: `next/dynamic` usage patterns
- Missing: Dependency array best practices
- Missing: `next/image` component requirements
- Missing: React.memo, useCallback patterns

**Remediation:** Add "Frontend Performance Patterns" section

**Current Status:** ~10% coverage

---

## 📊 COMPLIANCE SUMMARY TABLE

| Rule # | Rule Name                      | Guardian Coverage | Copilot Coverage | Gap Level   |
| ------ | ------------------------------ | ----------------- | ---------------- | ----------- |
| 1      | NEXT.js APP ROUTER             | 100%              | 100%             | ✅ None     |
| 2      | STATE MANAGEMENT               | 100%              | 30%              | ⚠️ High     |
| 3      | DATA FETCHING (TanStack Query) | 100%              | 25%              | ⚠️ Critical |
| 4      | API ENDPOINTS                  | 100%              | 80%              | ⚠️ Medium   |
| 5      | CUSTOM HOOKS PATTERNS          | 100%              | 20%              | ⚠️ Critical |
| 6      | ERROR HANDLING & BOUNDARY      | 100%              | 85%              | ⚠️ Low      |
| 7      | UI COMPONENTS                  | 100%              | 40%              | ⚠️ High     |
| 8      | TELEGRAM BOT INTEGRATION       | 100%              | 100%             | ✅ None     |
| 9      | DATABASE PATTERNS              | 100%              | 95%              | ⚠️ Low      |
| 10     | FILE STRUCTURE                 | 100%              | 50%              | ⚠️ High     |
| 11     | TYPE SAFETY & VALIDATION       | 100%              | 0%               | ❌ Critical |
| 12     | CODE QUALITY STANDARDS         | 100%              | 90%              | ⚠️ Low      |
| 13     | PERFORMANCE & OPTIMIZATION     | 100%              | 10%              | ❌ Critical |
| 14     | SECURITY REQUIREMENTS          | 100%              | 100%             | ✅ None     |
| 15     | TESTING MANDATORY              | 100%              | 100%             | ✅ None     |
| 16     | DEPLOYMENT REQUIREMENTS        | 100%              | 100%             | ✅ None     |

**Compliance Score: 9/16 (56.25%)**

---

## 🔴 CRITICAL GAPS (Must Address)

### Priority 1: DATA FETCHING PATTERNS (Impact: 🔴 HIGH)

**Missing in copilot-instructions.md:**

```typescript
// MISSING: These patterns are NOT documented

// Hook signature
export const useApiQuery = <TData>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: {
    staleTime?: number;
    retry?: number;
    enabled?: boolean;
  }
) => UseQueryResult<TData>;

// Query keys factory
export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    byWorkspace: (id: string) => ["tasks", "workspace", id] as const,
    detail: (id: string) => ["tasks", "detail", id] as const,
  },
  labels: {
    all: ["labels"] as const,
    byWorkspace: (id: string) => ["labels", "workspace", id] as const,
  },
};

// Mutation with Persian messages
const mutation = useApiMutation<Task, CreateTaskInput>(createTask, {
  successMessage: "تسک با موفقیت ایجاد شد",
  errorMessage: "خطا در ایجاد تسک",
  invalidateQueries: [queryKeys.tasks.all],
});
```

**Action Required:** Add comprehensive section with example implementations

---

### Priority 2: TYPE SAFETY (Impact: 🔴 HIGH)

**Missing in copilot-instructions.md:**

```typescript
// MISSING: TypeScript configuration and patterns

// tsconfig.json strict mode requirement
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}

// DTO types (never use `any`)
interface CreateTaskInput {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  due_date?: string;
}

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

// Constants with `as const`
export const API_ENDPOINTS = {
  TASKS: '/api/tasks',
  WORKSPACES: '/api/workspaces',
  LABELS: '/api/labels',
} as const;
```

**Action Required:** Add "TypeScript Standards" section with strict mode requirement

---

### Priority 3: HOOK PATTERNS (Impact: 🟡 MEDIUM)

**Missing in copilot-instructions.md:**

```typescript
// MISSING: Domain-specific hook patterns

// src/hooks/tasks/useTasks.ts
export const useTasks = (workspaceId: string) => {
  return useApiQuery(
    queryKeys.tasks.byWorkspace(workspaceId),
    () => fetchTasks(workspaceId),
    { staleTime: 2 * 60 * 1000 } // 2 min
  );
};

export const useCreateTask = () => {
  return useApiMutation<Task, CreateTaskInput>(createTask, {
    successMessage: "تسک ایجاد شد",
    errorMessage: "خطا در ایجاد تسک",
    invalidateQueries: [queryKeys.tasks.all],
  });
};

export const useUpdateTask = () => {
  return useApiMutation<Task, UpdateTaskInput>(updateTask, {
    successMessage: "تسک به‌روزرسانی شد",
    errorMessage: "خطا در به‌روزرسانی",
    invalidateQueries: [queryKeys.tasks.all],
    optimisticUpdate: (oldData, variables) => ({
      ...oldData,
      ...variables,
    }),
  });
};
```

**Action Required:** Add "Hook Patterns per Domain" section with examples

---

## 🟡 RECOMMENDED ENHANCEMENTS (Medium Priority)

1. **UI Components Standards** - Add dark mode prefix convention, accessibility checklist
2. **File Structure Diagram** - Visual representation of where files belong
3. **State Management Examples** - Store initialization, hydration patterns
4. **Performance Optimization Guide** - Code splitting, memoization patterns
5. **Integration Testing Patterns** - Database fixtures, mock Supabase patterns

---

## ✅ REMEDIATION CHECKLIST

**To achieve 100% compliance with TASKBOT_GUARDIAN.md:**

- [ ] Add "TypeScript & Type Safety" section (CRITICAL)
- [ ] Add "Data Fetching Patterns" section with hook signatures (CRITICAL)
- [ ] Add "Custom Hook Patterns per Domain" section (HIGH)
- [ ] Add "UI Components Standards" section (MEDIUM)
- [ ] Add "File Structure & Organization" section (MEDIUM)
- [ ] Add "State Management Implementation" section (MEDIUM)
- [ ] Add "Frontend Performance Patterns" section (MEDIUM)
- [ ] Add "Injection Detection & PR Blocking" reference (LOW)

---

## 📝 FINAL VERDICT

**Current Status:** ⚠️ **PARTIAL COMPLIANCE (56.25%)**

**Recommendation:**

- ✅ `copilot-instructions.md` is suitable for **performance optimization work**
- ⚠️ `copilot-instructions.md` is **insufficient for new feature development** (missing type/hook patterns)
- ❌ **Cannot enforce TASKBOT_GUARDIAN.md rules** without adding 7 critical sections

**Next Steps:**

1. Integrate TASKBOT_GUARDIAN rules into copilot-instructions.md
2. Add critical missing sections (TypeScript, Data Fetching, Hooks)
3. Create enforcement automation via PR checks
4. Version control: Update copilot-instructions.md to v2.0 with full Guardian compliance
