# Frontend — PR-by-PR Implementation Plan

Build the TeamOps client in `frontend/` **by hand, one small PR at a time** — using the existing
`project-management-main/client` as a reference you read, not a folder you copy.

## The golden rule of this plan

> **Never copy a whole file.** Open the reference component, understand it, then type your own
> version. The UI/JSX you may lift freely (it's not graded and not the point) — but **you must
> understand every data flow**: where each piece of state comes from, which API call fills it, and
> which reducer updates it. That's the part that connects to your backend.

## What we're changing vs the reference (and why)

| Reference uses | We use | Why |
|---|---|---|
| **Clerk React** (`ClerkProvider`, `useUser`, `useAuth`, `getToken`, `SignIn`) | **Local auth** (our own login page + JWT in localStorage + AuthContext) | Matches the local auth we built in the backend; no external SaaS |
| **`VITE_BASEURL`** pointing at a Vercel URL | **Relative `/api`** base URL | So nginx can reverse-proxy `/api/*` to the app tier. **This is the single most important frontend change for the 3-tier deploy.** |
| Clerk `CreateOrganization` flow | A simple "create workspace" call | We own the workspace-creation path |

Everything else — the pages, the components, the Redux slices, the charts — stays. We're swapping
**how the app authenticates** and **how it addresses the API**, nothing more.

## The tech (what each dependency is for)

`react` + `react-dom` · `vite` (build tool) · `react-router-dom` (routing) · `@reduxjs/toolkit` +
`react-redux` (state) · `axios` (HTTP) · `tailwindcss` (styling) · `recharts` (charts) ·
`lucide-react` (icons) · `react-hot-toast` (notifications) · `date-fns` (dates).

---

# PHASE F0 — A React app that runs

### PR-1 · Scaffold the client
- **Build:** Vite React app in `frontend/`, clean out boilerplate, `App.jsx` renders "TeamOps".
- **Learn:** Vite dev server, the React entry (`main.jsx` → `App.jsx`), HMR.
- **Done when:** `npm run dev` shows the page at `:5173`.

### PR-2 · Tailwind setup
- **Build:** add `tailwindcss` + the Vite plugin, `index.css` with the Tailwind import.
- **Learn:** utility-first CSS; how Tailwind is wired into Vite.
- **Done when:** a `text-blue-500` class actually turns text blue.

### PR-3 · Router + empty pages
- **Build:** `App.jsx` routes (from the reference): `/` (Dashboard), `team`, `projects`,
  `projectsDetail`, `taskDetails`, all under a `Layout`. Create stub pages.
- **Learn:** `react-router-dom` v7, nested routes, `<Outlet/>`.
- **Done when:** navigating the URLs swaps the stub pages.

### PR-4 · Redux store + provider
- **Build:** `app/store.js` with `configureStore`, wrap `<App/>` in `<Provider>`.
- **Learn:** what a store is; why global state; RTK vs old Redux.
- **Done when:** React DevTools shows the store mounted.

---

# PHASE F1 — API layer + auth (local, replacing Clerk)

### PR-5 · axios instance with relative base URL ⭐
- **Build:** `configs/api.js` — an axios instance with `baseURL: import.meta.env.VITE_BASEURL || "/api"`.
  An interceptor that attaches `Authorization: Bearer <token>` from localStorage.
- **Learn:** why a **relative** base URL is what lets nginx proxy the API in production; axios
  interceptors; centralizing HTTP.
- **Done when:** `api.get("/health")` (proxied in dev) succeeds and auto-attaches the header.

### PR-6 · Auth context (replacing Clerk's provider)
- **Build:** `context/AuthContext.jsx` — holds the current user + token, `login()`/`logout()`,
  persists token in localStorage. Replaces `ClerkProvider` / `useUser` / `useAuth`.
- **Learn:** React context; where auth state lives; the localStorage token pattern.
- **Done when:** `useAuth()` returns the user; refresh keeps you logged in.

### PR-7 · Login / register page
- **Build:** a `Login.jsx` that calls `POST /api/auth/login`, stores the token, redirects. Replaces
  Clerk's `<SignIn/>`.
- **Learn:** controlled form inputs; calling your own auth API; redirect-on-success.
- **Done when:** logging in as a seeded user lands you on the Dashboard; bad creds show an error toast.

### PR-8 · Route protection
- **Build:** gate the `Layout` routes — no token → redirect to `/login` (mirrors the reference's
  `if (!user) <SignIn/>`).
- **Learn:** protected routes on the client (and that the *real* enforcement is server-side).
- **Done when:** visiting `/` while logged out bounces to login.

---

# PHASE F2 — The shell (layout, theme, nav)

### PR-9 · Theme slice (light/dark)
- **Build:** `features/themeSlice.js` + `loadTheme`, toggling a `dark` class.
- **Learn:** an RTK slice with reducers; persisting a preference.
- **Done when:** toggling switches the whole app light/dark and survives refresh.

### PR-10 · Layout shell
- **Build:** `pages/Layout.jsx` — sidebar + navbar + `<Outlet/>`, plus the loading spinner state.
  (Swap Clerk's `useUser` for our `useAuth`.)
- **Learn:** app-shell pattern; where the initial data-load is triggered.
- **Done when:** the frame renders around every page.

### PR-11 · Sidebar
- **Build:** `components/Sidebar.jsx` — nav links, active state, mobile open/close.
- **Done when:** links navigate; sidebar collapses on mobile.

### PR-12 · Navbar + WorkspaceDropdown
- **Build:** `components/Navbar.jsx` and `WorkspaceDropdown.jsx` (switch current workspace).
- **Learn:** dispatching `setCurrentWorkspace`; reading state with `useSelector`.
- **Done when:** switching workspace in the dropdown updates the app.

---

# PHASE F3 — Workspace data flow (the spine)

### PR-13 · `fetchWorkspaces` thunk ⭐
- **Build:** `features/workspaceSlice.js` — the `createAsyncThunk` calling `GET /api/workspaces`,
  plus `extraReducers` for pending/fulfilled/rejected. Trigger it on load in `Layout`. **Drop the
  Clerk `getToken` arg** — the axios interceptor now handles the token.
- **Learn:** async thunks; the loading lifecycle; how one fetch hydrates the entire UI.
- **Done when:** on login, real workspaces load from your backend into Redux (watch the Network tab).

### PR-14 · Current-workspace selection + persistence
- **Build:** the `fulfilled` logic that picks `currentWorkspace` (from localStorage or first), and
  `setCurrentWorkspace` writing back to localStorage.
- **Learn:** derived state; remembering a selection across sessions.
- **Done when:** your chosen workspace is remembered after refresh.

---

# PHASE F4 — Dashboard

### PR-15 · Dashboard skeleton
- **Build:** `pages/Dashboard.jsx` reading `currentWorkspace` from Redux.
- **Done when:** it renders the current workspace's name and project count from real data.

### PR-16 · StatsGrid
- **Build:** `components/StatsGrid.jsx` — totals (projects, tasks, done, members) computed from state.
- **Learn:** deriving stats from nested data with `reduce`/`filter`.
- **Done when:** the numbers match what's in the DB.

### PR-17 · TasksSummary + RecentActivity
- **Build:** both components, reading tasks across projects.
- **Done when:** they list real tasks/activity.

### PR-18 · Analytics charts (Recharts)
- **Build:** `components/ProjectAnalytics.jsx` — task-by-status / by-priority charts.
- **Learn:** feeding derived data into Recharts.
- **Done when:** charts reflect real task distributions.

---

# PHASE F5 — Projects

### PR-19 · Projects list + ProjectCard
- **Build:** `pages/Projects.jsx` + `components/ProjectCard.jsx`.
- **Done when:** all projects in the workspace render as cards, linking to details.

### PR-20 · CreateProjectDialog → real POST ⭐
- **Build:** `components/CreateProjectDialog.jsx` → `POST /api/projects` → on success dispatch
  `addProject`. Handle the 403 (non-admin) with a toast.
- **Learn:** create-then-update-store; optimistic vs server-confirmed UI; surfacing permission errors.
- **Done when:** creating a project persists to the DB and appears without a refresh.

### PR-21 · ProjectDetails page
- **Build:** `pages/ProjectDetails.jsx` (reads `projectId` from query params).
- **Done when:** clicking a card opens its real details.

### PR-22 · ProjectTasks (board/list)
- **Build:** `components/ProjectTasks.jsx` — tasks grouped by status.
- **Done when:** a project's tasks render grouped TODO / IN_PROGRESS / DONE.

### PR-23 · ProjectOverview + ProjectSettings
- **Build:** overview panel; settings that call `PUT /api/projects` → `updateWorkspace`/reducer.
- **Done when:** editing project settings persists.

### PR-24 · ProjectCalendar
- **Build:** `components/ProjectCalendar.jsx` — tasks on a date grid via `date-fns`.
- **Done when:** tasks show on their due dates.

---

# PHASE F6 — Tasks (the core demo loop)

### PR-25 · CreateTaskDialog → real POST ⭐
- **Build:** `components/CreateTaskDialog.jsx` → `POST /api/tasks` → dispatch `addTask`.
- **Learn:** forms with selects (assignee, priority, type, due date); posting relations.
- **Done when:** a new task persists and shows in the project.

### PR-26 · TaskDetails page
- **Build:** `pages/TaskDetails.jsx` — reads task + project from state (or fetches), shows info.
- **Done when:** opening a task shows its real details.

### PR-27 · Update task status → real PUT ⭐ (the money demo)
- **Build:** status control → `PUT /api/tasks/:id` → dispatch `updateTask`.
- **Learn:** the full round-trip: UI → API → DB → store → re-render.
- **Done when:** moving a task TODO → DONE **persists across refresh.** *(This is the moment that
  proves the whole stack works — it's your demo.)*

### PR-28 · Delete task → real POST
- **Build:** delete (single/bulk) → `POST /api/tasks/delete` → dispatch `deleteTask`.
- **Done when:** deleted tasks stay gone after refresh.

---

# PHASE F7 — Comments & team

### PR-29 · Comments on a task
- **Build:** in `TaskDetails`, load `GET /api/comments/:taskId` and post via `POST /api/comments`.
  (Replaces the reference's simulated `setTimeout` comment.)
- **Learn:** a per-entity sub-resource; refetch-after-post.
- **Done when:** posting a comment persists and reloads with the author.

### PR-30 · Team page + member dialogs
- **Build:** `pages/Team.jsx`, `components/AddProjectMember.jsx`, `InviteMemberDialog.jsx` →
  the `add-member` endpoints.
- **Done when:** adding a member persists and appears in the team list.

---

# PHASE F8 — Production build (the deploy hook)

### PR-31 · Production build + relative-API verification ⭐
- **Build:** `npm run build` → `dist/`. Confirm **nothing** hardcodes `localhost:5000`; all calls go
  to relative `/api`. Add a `.env.production` if needed.
- **Learn:** dev server vs static build; why a baked-in `localhost` URL breaks behind a load balancer.
- **Done when:** the built `dist/` works when the API is served from the same origin under `/api`.

### PR-32 · Frontend container / nginx parity
- **Build:** a Dockerfile (or compose service) that builds the app and serves `dist/` via nginx,
  proxying `/api` to the backend — a local mirror of the AWS web tier.
- **Learn:** how nginx will serve React + proxy the API on the real web tier (Phase 5 of infra).
- **Done when:** `docker compose up` serves the built frontend and it talks to the backend through nginx.

---

## Definition of done for the whole frontend
- Log in with a seeded user (local auth, no Clerk).
- Dashboard, projects, tasks, comments, team all render **real data** from your backend.
- Create a project → create a task → drag it to DONE → comment → **refresh** → everything persists.
- `grep -r "clerk" frontend/src` is empty; all API calls use the relative `/api` base URL.
- `npm run build` produces a `dist/` that works behind nginx.

## How frontend maps to backend (quick reference)
| UI action | API call | Redux |
|---|---|---|
| App load | `GET /api/workspaces` | `fetchWorkspaces` |
| Create project | `POST /api/projects` | `addProject` |
| Update project | `PUT /api/projects` | reducer |
| Create task | `POST /api/tasks` | `addTask` |
| Move task status | `PUT /api/tasks/:id` | `updateTask` |
| Delete task | `POST /api/tasks/delete` | `deleteTask` |
| Load comments | `GET /api/comments/:taskId` | local state |
| Add comment | `POST /api/comments` | local state |
| Add member | `POST /api/workspaces/add-member` · `/projects/:id/addMember` | reducer |
| Login | `POST /api/auth/login` | AuthContext |
