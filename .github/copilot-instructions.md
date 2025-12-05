<!-- .github/copilot-instructions.md - guidance for AI coding agents working on TaskBot Dashboard -->

# 🚀 TaskBot Dashboard - AI Development Guidelines (2025 Standards)

## 🎯 Mission

**Transform TaskBot Dashboard into a SaaS enterprise-ready platform with 2025 performance standards:**

- TTFB (Time To First Byte) < 400ms
- FCP (First Contentful Paint) < 1.8s
- Task list with 1000 items load time < 2s
- Telegram response time < 1.5s

## Quick Context

- This is a Next.js (App Router) project (Next 14) using TypeScript, Tailwind and the `app/` directory.
- Persian (Farsi) RTL UI: root `app/layout.tsx` sets `lang="fa"` and `dir="rtl"`.
- Supabase is the primary backend (db + auth + realtime). A Telegram bot (Telegraf) integrates via a server webhook.
- **CRITICAL**: Follow REFACTORING_GUIDE_2025.md standards for ANY changes

# Key Files & Patterns (browse these first)

- `src/app/api/telegram/route.ts` — Telegram webhook + Telegraf handlers. Server-only code; expects `TELEGRAM_BOT_TOKEN` and `SUPABASE_SERVICE_ROLE_KEY`.
- `src/lib/supabase.ts` — client init: uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. It intentionally falls back to placeholders to avoid build-time crashes.
- `src/app/webapp/*` and `src/app/dashboard/*` — web UI areas (kanban uses `@dnd-kit/*`).
- `src/components/ui/*` — reusable UI primitives (button, card, input, progress, badge).
- `supabase/migrations/*` and `Note.md` — DB schema and migration guidance (policies, indexes, RLS). Read `Note.md` for project-specific migration and supabase CLI commands.

# Environment & Secrets

- Required env vars (server/runtime):
  - `TELEGRAM_BOT_TOKEN` (server only)
  - `SUPABASE_SERVICE_ROLE_KEY` (server only)
  - `NEXT_PUBLIC_SUPABASE_URL` (client+server)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client)
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or `TELEGRAM_BOT_TOKEN` to client code or commits.

# Running & Developer Workflows

- Dev server: `npm run dev` (Next default on port 3000).
- Build: `npm run build` then `npm run start` for production locally.
- Lint: `npm run lint` (uses `eslint-config-next`).
- Supabase CLI (from `Note.md`):
  - `supabase login`
  - `supabase link --project-ref <ref>` (project-ref in `Note.md`)
  - `supabase db push` to apply migrations located under `supabase/migrations`.
- Telegram webhook testing: the repo includes a curl sample in `Note.md` that posts a fake update to `/api/telegram` — use that when testing handlers locally (or use ngrok/forwarding when testing with a real bot).

# Codebase Conventions & Patterns

## 🏗️ Architecture Rules (MANDATORY)

### 1️⃣ Database Performance (70% impact on speed)

**Required Indexes** - WITHOUT THESE, NO CHANGES ACCEPTED:

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status ON tasks(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_label_links(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_label_links(label_id);
```

**NO N+1 Queries** - Always use JOINs instead of multiple queries:

```typescript
// ❌ BAD - N+1 pattern
tasks.forEach((task) => await getLabels(task.id));

// ✅ GOOD - Single query with JOIN
supabase
  .from("tasks")
  .select(
    `
    *,
    labels:task_label_links(label_id, task_labels(name, color)),
    assignee:profiles!assignee_id(id, full_name, avatar_url),
    subtasks:subtasks(count),
    subtask_completed:subtasks!subtasks_completed_fkey(status)
  `
  )
  .eq("workspace_id", workspaceId)
  .order("created_at", { ascending: false })
  .range(offset, offset + limit);
```

**Pagination MANDATORY** - Never load all tasks at once:

- Default limit: 50
- Maximum limit: 200 (enforce this, never allow > 200)
- Always use `.range(offset, offset + limit)`

### 2️⃣ Server Components (Next.js 14+)

Every dashboard page (kanban, list, calendar) MUST be a Server Component:

```typescript
// ✅ GOOD - Server Component fetches data server-side
export default async function KanbanPage() {
  const tasks = await supabase.from("tasks").select("*");
  return <KanbanBoard tasks={tasks} />;
}

// ❌ BAD - useEffect in Client Component
("use client");
export default function KanbanPage() {
  useEffect(() => {
    // Client-side fetching = slower, more bandwidth
    fetchTasks();
  }, []);
}
```

### 3️⃣ Frontend Optimization (20% impact)

**Virtualization Required** for lists > 50 items:

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";
// or
import { FixedSizeList } from "react-window";
```

**Code Splitting** for heavy components:

```typescript
// TaskDetailModal loads ONLY when opened
const TaskDetailModal = dynamic(() => import("@/components/TaskDetailModal"), {
  ssr: false,
  loading: () => <LoadingSkeleton />,
});
```

**React Server Components + Streaming**:

```typescript
import { Suspense } from "react";

<Suspense fallback={<LoadingSkeleton />}>
  <TasksList />
</Suspense>;
```

### 4️⃣ Code Standards 2025

**Modern API Routes** (const-based):

```typescript
// ✅ GOOD
export const GET = async (req: Request) => { ... }

// ❌ BAD (old style)
export async function GET(req: Request) { ... }
```

**Input Validation with Zod**:

```typescript
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1).max(500),
  priority: z.enum(["urgent", "high", "medium", "low"]),
  due_date: z.string().date().optional(),
});

// Use in API routes and Telegram handlers
const validated = TaskSchema.parse(input);
```

**Environment Variables Validation**:

```typescript
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env");
}
```

### 5️⃣ Realtime & Telegram

**Scoped Realtime Subscriptions**:

```typescript
// ✅ GOOD - only specific workspace
supabase
  .channel(`workspace:${workspaceId}`)
  .on(
    "postgres_changes",
    {
      /* ... */
    },
    callback
  )
  .subscribe();

// ❌ BAD - entire tasks table
supabase.channel("tasks").subscribe();
```

**Telegram Webhook Performance**:

- Response must be < 1.5s or Telegram will timeout
- Use queue for slow operations (send to background job)
- Always reply immediately with 200 OK

## 🚨 Server vs Client

- Code under `src/app/api/*` and any files that import server-only env vars should be treated as server-only.
- `src/lib/supabase.ts` is safe to import on both sides because it uses placeholder defaults to avoid build-time crashes. Prefer creating a server-only supabase client using service role key for migrations and admin actions in API routes.
- Telegram handlers:
  - Handlers use `Telegraf` and register commands via `bot.command(...)` and `bot.start(...)`.
  - The webhook endpoint calls `bot.handleUpdate(body)` inside the exported `POST` function.
  - Commands often call `getOrCreateUser` which reads/writes the `profiles` table; follow the same pattern when adding new commands.
- Database & RLS:
  - `Note.md` contains SQL that enables RLS and creates policies; migrations reflect assumptions about `profiles` and `tasks` tables and `assignee_id` usage.
  - Tasks are authored with `assignee_id` referencing `profiles.id` (UUID). When writing server-side updates, check `assignee_id` for ownership.
- UI & localization:
  - The app uses RTL layout and Farsi strings in the repo — keep text direction and localization in mind when creating UI components.

## 📋 TypeScript & Type Safety (MANDATORY)

**Strict Mode Required** — All TypeScript files must compile with strict mode enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**DTO & Interface Patterns**:

```typescript
// ✅ GOOD - Strict types, no `any`
interface CreateTaskInput {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  assignee_id?: string;
  due_date?: string; // ISO 8601 format
  workspace_id: string;
}

interface Task extends CreateTaskInput {
  id: string;
  created_at: string;
  updated_at: string;
  status: "todo" | "in-progress" | "done";
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

// ❌ BAD - Avoid any type
interface BadTask {
  data: any; // ❌ NEVER
  metadata: Record<string, any>; // ❌ AVOID
}
```

**Constants with `as const`**:

```typescript
// ✅ GOOD - Type-safe constants
export const API_ENDPOINTS = {
  TASKS: "/api/tasks",
  WORKSPACES: "/api/workspaces",
  LABELS: "/api/labels",
  SUBTASKS: "/api/subtasks",
} as const;

export const TASK_PRIORITIES = ["urgent", "high", "medium", "low"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
```

---

## 🔌 Data Fetching Patterns (TanStack Query v5)

**Always use wrappers** — Never call `useQuery` directly:

```typescript
// ✅ GOOD - Custom hook wrapper
export const useApiQuery = <TData>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<TData>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    retry?: number | boolean;
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: queryKey as unknown[],
    queryFn,
    staleTime: 2 * 60 * 1000, // 2 min default
    gcTime: 10 * 60 * 1000, // 10 min default
    ...options,
  });
};

// ❌ BAD - Direct useQuery
useQuery({ queryKey: ["tasks"], queryFn: fetchTasks });
```

**Query Keys Factory** — Centralize in `src/lib/api-client.ts`:

```typescript
export const queryKeys = {
  tasks: {
    all: ["tasks"] as const,
    byWorkspace: (workspaceId: string) =>
      ["tasks", "workspace", workspaceId] as const,
    byUser: (userId: string) => ["tasks", "user", userId] as const,
    detail: (taskId: string) => ["tasks", "detail", taskId] as const,
  },
  labels: {
    all: ["labels"] as const,
    byWorkspace: (workspaceId: string) =>
      ["labels", "workspace", workspaceId] as const,
  },
  subtasks: {
    byTask: (taskId: string) => ["subtasks", "task", taskId] as const,
  },
  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", "detail", id] as const,
  },
} as const;
```

**Stale Times Per Entity**:

```typescript
// staleTime determines when data becomes stale
// Lower = fresher but more API calls
// Higher = fewer API calls but potentially stale data

const STALE_TIMES = {
  tasks: 2 * 60 * 1000, // 2 min (frequently changes)
  labels: 10 * 60 * 1000, // 10 min (rarely changes)
  workspaces: 5 * 60 * 1000, // 5 min (occasionally changes)
  subtasks: 2 * 60 * 1000, // 2 min (frequently changes)
  userProfile: 15 * 60 * 1000, // 15 min (rarely changes)
};
```

**Mutations with Persian Messages**:

```typescript
// ✅ GOOD - Mutation with invalidation & toasts
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json() as Promise<Task>;
    },
    onSuccess: (newTask) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks.byWorkspace(newTask.workspace_id),
      });
      // Show Persian success toast
      toast.success("✅ تسک با موفقیت ایجاد شد");
    },
    onError: () => {
      toast.error("❌ خطا در ایجاد تسک");
    },
  });
};
```

---

## 🎣 Custom Hooks Per Domain

**Naming Convention**: `use{Entity}{Action}` in `src/hooks/{domain}/`

```typescript
// src/hooks/tasks/useTasks.ts
export const useTasks = (workspaceId: string) => {
  return useApiQuery(
    queryKeys.tasks.byWorkspace(workspaceId),
    () => fetchTasks(workspaceId),
    { staleTime: STALE_TIMES.tasks }
  );
};

// src/hooks/tasks/useCreateTask.ts
export const useCreateTask = () => {
  // Implementation here with Persian messages
};

// src/hooks/tasks/useUpdateTask.ts
export const useUpdateTask = () => {
  // Implementation with optimistic updates
};

// src/hooks/tasks/useDeleteTask.ts
export const useDeleteTask = () => {
  // Implementation with undo capability
};

// src/hooks/labels/useLabels.ts
export const useLabels = (workspaceId: string) => {
  return useApiQuery(
    queryKeys.labels.byWorkspace(workspaceId),
    () => fetchLabels(workspaceId),
    { staleTime: STALE_TIMES.labels }
  );
};

// src/hooks/workspaces/useWorkspaces.ts
export const useWorkspaces = () => {
  return useApiQuery(queryKeys.workspaces.all, fetchWorkspaces, {
    staleTime: STALE_TIMES.workspaces,
  });
};
```

**Hook Options with Persian Messages**:

```typescript
interface UseApiMutationOptions<TData, TVariables> {
  successMessage?: string; // Persian: "تسک ایجاد شد"
  errorMessage?: string; // Persian: "خطا در ایجاد تسک"
  invalidateQueries?: (readonly unknown[])[];
  optimisticUpdate?: (oldData: TData, variables: TVariables) => TData;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

// Usage
const mutation = useUpdateTask({
  successMessage: "تسک به‌روزرسانی شد",
  errorMessage: "خطا در به‌روزرسانی تسک",
  invalidateQueries: [queryKeys.tasks.all],
});
```

---

## 🎨 UI Components Standards

**shadcn/ui + Radix + Tailwind Only**:

```typescript
// ✅ GOOD - Use shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ❌ BAD - Material-UI or other libraries
import { Button as MuiButton } from "@mui/material";
```

**Dark Mode Support**:

```typescript
// ✅ GOOD - Tailwind dark mode classes
export function TaskCard() {
  return (
    <div className="bg-white dark:bg-slate-900 text-black dark:text-white border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg dark:text-gray-100">Task Title</h3>
      <p className="text-gray-600 dark:text-gray-400">Description</p>
    </div>
  );
}
```

**RTL Awareness**:

```typescript
// ✅ GOOD - RTL-aware spacing
<div className="ps-4 pe-2">  // padding-start (RTL-aware)
  <p className="text-start">Content</p> // text-start (RTL-aware)
</div>

// ❌ BAD - LTR-only
<div className="pl-4 pr-2">  // padding-left (wrong for RTL)
  <p className="text-left">Content</p> // text-left (wrong for RTL)
</div>
```

**Accessibility Requirements**:

```typescript
// ✅ GOOD - ARIA labels + keyboard navigation
export function TaskButton() {
  return (
    <button
      aria-label="حذف تسک"
      aria-describedby="task-help"
      onKeyDown={(e) => {
        if (e.key === "Enter") handleDelete();
      }}
    >
      Delete
    </button>
  );
}

// Loading skeleton component
export function TaskSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
}
```

---

## 📁 File Structure & Organization

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with RTL, lang="fa"
│   ├── page.tsx                 # Landing page
│   ├── api/
│   │   ├── tasks/
│   │   │   ├── route.ts         # GET, POST /api/tasks
│   │   │   └── [id]/route.ts    # GET, PUT, DELETE /api/tasks/[id]
│   │   ├── labels/route.ts      # Label CRUD endpoints
│   │   ├── workspaces/route.ts  # Workspace CRUD
│   │   └── telegram/route.ts    # Webhook handler
│   ├── dashboard/               # Protected dashboard pages (Server Components)
│   │   ├── layout.tsx          # Dashboard layout
│   │   ├── kanban/page.tsx      # Kanban board view
│   │   ├── calendar/page.tsx    # Calendar view
│   │   ├── list/page.tsx        # List view
│   │   ├── search/page.tsx      # Search & filtering
│   │   └── analytics/page.tsx   # Analytics dashboard
│   └── webapp/                  # Legacy webapp area (if any)
│
├── components/
│   ├── ui/                      # shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   └── ...
│   ├── TaskDetailModal.tsx      # Feature component (dynamic import)
│   ├── TaskFilters.tsx          # Feature component (dynamic import)
│   ├── NotificationsDropdown.tsx # Feature component (dynamic import)
│   ├── ErrorBoundary.tsx        # Error boundary wrapper
│   └── layouts/                 # Layout components
│       └── DashboardLayout.tsx
│
├── contexts/                    # React Context providers
│   ├── auth-context.tsx         # Authentication context
│   ├── workspace-context.tsx    # Workspace selection
│   └── i18n-context.tsx         # Internationalization
│
├── hooks/                       # Custom hooks organized by domain
│   ├── tasks/
│   │   ├── useTasks.ts
│   │   ├── useCreateTask.ts
│   │   ├── useUpdateTask.ts
│   │   └── useDeleteTask.ts
│   ├── labels/
│   │   ├── useLabels.ts
│   │   ├── useCreateLabel.ts
│   │   └── useUpdateLabel.ts
│   ├── workspaces/
│   │   ├── useWorkspaces.ts
│   │   └── useCreateWorkspace.ts
│   ├── auth/
│   │   ├── useAuth.ts
│   │   └── useLogout.ts
│   ├── useApi.ts                # Base query wrapper
│   ├── useKeyboardShortcuts.ts  # Keyboard navigation
│   ├── useWebSocket.ts          # Realtime subscriptions
│   └── useAccessibility.ts      # Screen reader support
│
├── lib/                         # Utilities & configurations
│   ├── supabase.ts              # Supabase client (public)
│   ├── api-client.ts            # Query keys + API helpers
│   ├── i18n.ts                  # Translations
│   ├── cache-strategies.ts      # Caching logic
│   └── utils.ts                 # General utilities
│
├── stores/                      # Zustand stores
│   ├── user-store.ts            # User auth state
│   └── ui-store.ts              # UI state (sidebar, theme)
│
└── test/
    └── setup.ts                 # Vitest configuration
```

**Where to Place New Files**:

- 🆕 New page? → `src/app/{feature}/page.tsx` (Server Component by default)
- 🆕 New API route? → `src/app/api/{resource}/route.ts`
- 🆕 New hook? → `src/hooks/{domain}/{useAction}.ts`
- 🆕 New component? → `src/components/{FeatureName}.tsx` + add to ui/ if reusable
- 🆕 New store? → `src/stores/{feature-store}.ts`

---

## 🚀 State Management (Zustand + Context)

**Zustand Stores** — For global state (auth, UI):

```typescript
// src/stores/user-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserState {
  userId: string | null;
  email: string | null;
  fullName: string | null;
  setUser: (user: UserState) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      email: null,
      fullName: null,
      setUser: (user) => set(user),
      logout: () => set({ userId: null, email: null, fullName: null }),
    }),
    {
      name: "user-storage", // localStorage key
      partialize: (state) => ({
        userId: state.userId,
        email: state.email,
        fullName: state.fullName,
      }),
    }
  )
);

// Usage in component
export function UserProfile() {
  const { fullName, logout } = useUserStore();
  return (
    <div>
      <p>Welcome, {fullName}</p>
      <button onClick={logout}>خروج</button>
    </div>
  );
}
```

**Context API** — For shared configuration:

```typescript
// src/contexts/workspace-context.tsx
const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );

  return (
    <WorkspaceContext.Provider
      value={{ selectedWorkspace, setSelectedWorkspace }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context)
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  return context;
};
```

---

## ⚡ Frontend Performance Patterns

**Dynamic Imports for Heavy Components**:

```typescript
// ✅ GOOD - Load only when needed
import dynamic from "next/dynamic";

const TaskDetailModal = dynamic(() => import("@/components/TaskDetailModal"), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />,
  ssr: false, // Client-side only
});

export function TaskListPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <>
      <TaskList />
      {selectedTaskId && <TaskDetailModal taskId={selectedTaskId} />}
    </>
  );
}
```

**Memoization & Dependency Arrays**:

```typescript
// ✅ GOOD - Prevent unnecessary re-renders
const TaskRow = React.memo(function TaskRow({ task, onSelect }: Props) {
  const handleClick = useCallback(() => {
    onSelect(task.id);
  }, [task.id, onSelect]);

  return <div onClick={handleClick}>{task.title}</div>;
});

// ❌ BAD - Re-renders on every parent render
function TaskRow({ task, onSelect }: Props) {
  return <div onClick={() => onSelect(task.id)}>{task.title}</div>;
}
```

**Image Optimization**:

```typescript
// ✅ GOOD - next/image automatic optimization
import Image from "next/image";

export function UserAvatar({ url, name }: Props) {
  return (
    <Image
      src={url}
      alt={name}
      width={40}
      height={40}
      className="rounded-full"
      priority={false}
    />
  );
}
```

---

## 🛡️ Prompt Injection Defense

**Every PR from AI agents is scanned for**:

- ❌ "ignore previous instructions" → BLOCKED
- ❌ "DAN" (Do Anything Now) → BLOCKED
- ❌ "jailbreak" attempts → BLOCKED
- ❌ "forget rules" → BLOCKED

**If detected**: PR blocked immediately with message:

> "Prompt injection detected. PR blocked."

---

# Small Examples (copy/paste patterns)

- Telegram command to add task (follow `route.ts` style):
  - `bot.command('new', async (ctx) => { /* parse ctx.message.text, use server supabase client, reply with confirmation */ })`
- Webhook handler skeleton (already used in repo):
  - `export async function POST(req: NextRequest) { const body = await req.json(); await bot.handleUpdate(body); return new Response('OK') }`

# Where to Look When You Get Stuck

- If a server route fails: check env vars and `Note.md` for supabase project ref + migration status.
- For DB schema questions: inspect `supabase/migrations/*.sql` and `Note.md` migration snippet.
- For UI component styling: review `src/components/ui/*` (they use Tailwind + `class-variance-authority`).

# Safety & Commit Guidance

- Never commit env secrets. If you need to test with real tokens, use local `.env` and CI secrets.
- Tests are MANDATORY (no longer optional):
  - Unit tests with Vitest + @testing-library/react
  - E2E tests with Playwright for critical flows
  - Before pushing: run `npm run test` and ensure all pass

## 📊 Performance Checklist (BEFORE PUSHING)

Every change must be validated against these metrics:

| Metric             | Before | After | Goal 2025 |
| ------------------ | ------ | ----- | --------- |
| TTFB (tasks list)  | -      | -     | < 400ms   |
| FCP (Lighthouse)   | -      | -     | < 1.8s    |
| Payload size (KB)  | -      | -     | < 300KB   |
| Telegram response  | -      | -     | < 1.5s    |
| DB queries/request | -      | -     | ≤ 3       |

**Before merging, measure & report these!**

## 🏆 Golden Rule for All AI Agents

**Before making ANY change, ask:**

> "Does this change solve one of the 5 root causes of slowness?"

If NO → Don't do it!

**5 Root Causes of Slowness:**

1. ❌ N+1 queries (missing indexes)
2. ❌ Client-side data fetching with useEffect
3. ❌ Artificial delays (setTimeout mocks)
4. ❌ Heavy bundles without code splitting
5. ❌ force-dynamic pages without ISR caching

---

## Phase 1: Extended Task System ✅ DONE

- New fields: `due_date`, `due_time`, `description`, `parent_task_id`, `subtask_count`/`subtask_completed`
- New tables: `task_labels`, `task_label_links`, `subtasks`
- New components: `TaskDetailModal.tsx`, `TaskFilters.tsx` (**now activated**)
- New API: `/api/tasks/{id}` (GET/PUT/DELETE), `/api/tasks/search`, `/api/subtasks`, `/api/labels`
- Migration: `20251128_phase1_extended_tasks.sql`

## Phase 2: Workspaces & Collaboration ✅ DONE

- New tables: `workspaces`, `workspace_members`, `boards`, `board_columns`, `activity_logs`
- Role-based access (owner, admin, member, viewer) with RLS policies
- Audit trail: tracks all task changes with user attribution
- New API: `/api/workspaces`
- Migration: `20251129_phase2_workspaces_rbac.sql`

## Phase 3: Templates & Recurring Tasks ✅ DONE

- New tables: `task_templates`, `recurring_task_instances`, `task_dependencies`, `task_time_logs`
- Recurring tasks with daily/weekly/monthly rules (uses `generate_recurring_task_instance()` function)
- Task templates for quick creation
- Migration: `20251130_phase3_templates_recurring.sql`

## Phase 4: Advanced Features ✅ DONE

- Calendar view: `/dashboard/calendar/page.tsx` displays tasks by due_date
- Advanced search with filtering on priority, status, labels, date ranges
- Enhanced Telegram commands: `/overdue`, `/today` (in addition to existing `/new`, `/mytasks`, `/done`)

## Phase 5: Performance Optimization (In Progress)

- ✅ Activate dead code (AnalyticsDashboard, NotificationsDropdown, TaskFilters, useAccessibility)
- 🔄 Database query optimization (remove N+1 patterns)
- 🔄 Implement virtualization for large lists
- 🔄 Dynamic imports for heavy components
- 🔄 ISR caching strategy for pages

---

## 📋 Short Checklist for PRs from an AI agent

- Include which files changed and a short rationale (feature, bugfix, refactor).
- **MANDATORY**: Report performance metrics (before/after) for TTFB, FCP, query count
- If you add a new server env var, add a one-line note in `Note.md` with how to set it and whether it's `NEXT_PUBLIC_`.
- For DB changes, update `supabase/migrations` with a timestamped SQL file and note RLS implications.
- Run tests: `npm run test` and ensure all pass before pushing
- Run build: `npm run build` to catch TypeScript/Next.js errors
