# Backend — PR-by-PR Implementation Plan

Build the TeamOps API in `backend/` **by hand, one small PR at a time** — using the existing
`project-management-main/server` as a reference you read, not a folder you copy. Each PR is a
small, reviewable, understandable unit. You should be able to explain every one.

## The golden rule of this plan

> **Never copy a whole file.** For each PR: open the reference file, read it, understand what it
> does, then type your own version into `backend/`. If you can't explain a line, you're not
> allowed to keep it.

## What we're changing vs the reference (and why)

The reference app is built for a **serverless** stack. We're building a **3-tier EC2 + RDS** app.
So four things change:

| Reference uses | We use | Why |
|---|---|---|
| **Neon** (`@prisma/adapter-neon`, websockets) | **Standard PostgreSQL** (plain Prisma) | Our data tier is RDS — a normal Postgres server |
| **Clerk** (`@clerk/express`, `req.auth()`) | **Local JWT auth** (our own `users` table) | No external SaaS; the app must be self-contained on AWS |
| **Inngest** (event queue for user-sync + email) | **Direct nodemailer call** (optional) | Inngest needs public webhooks; overkill for us |
| **Vercel** deploy config | **PM2 on EC2** | We deploy to our own servers |

The **data model, the controllers' business logic, and the route shapes stay the same** — that's
the real app, and it's good. We're only swapping the *plumbing* underneath it.

## The tech (what each dependency is for)

`express` (web framework) · `@prisma/client` + `prisma` (database ORM) · `pg` (Postgres driver) ·
`jsonwebtoken` + `bcryptjs` (our local auth) · `cors` · `dotenv` · `nodemailer` (email, late) ·
`nodemon` (dev auto-reload).

---

# PHASE B0 — A server that starts

### PR-1 · Scaffold the backend
- **Build:** `backend/package.json` (`"type": "module"`), `.gitignore` (node_modules, .env), folder
  skeleton: `configs/ controllers/ routes/ middlewares/ prisma/`. A `server.js` that starts Express
  and returns `"Server is live"` on `GET /`.
- **Learn:** Node ES modules, `npm init`, how Express boots.
- **Done when:** `node server.js` → visit `http://localhost:5000/` → see the message.

### PR-2 · Environment config
- **Build:** add `dotenv`, a `.env` (real, git-ignored) and `.env.example` (committed, no secrets).
  Read `PORT` from env.
- **Learn:** why secrets never live in code; the `.env` / `.env.example` split. *(This is the exact
  seam that becomes AWS Secrets Manager later.)*
- **Done when:** changing `PORT` in `.env` changes the port.

### PR-3 · Core middleware + health check
- **Build:** `app.use(cors())`, `app.use(express.json())`, and a `GET /health` returning `200`.
- **Learn:** what middleware is; why a load balancer needs a health endpoint (foreshadows the ALB).
- **Done when:** `curl /health` returns 200 and JSON body parsing works on a test POST.

---

# PHASE B1 — The database (Prisma + Postgres)

### PR-4 · Add Prisma, connect to local Postgres
- **Build:** `npm i prisma @prisma/client pg`, `npx prisma init`. Set the datasource to plain
  `postgresql` (**delete the Neon adapter, `directUrl`, and websocket bits** the reference has).
  `DATABASE_URL` points at a local Docker Postgres.
- **Learn:** what an ORM is; the Prisma datasource block; the difference between the reference's
  Neon setup and a standard connection.
- **Done when:** `npx prisma db pull` (or `migrate`) connects without error.

### PR-5 · Enums + User model
- **Build:** copy the enums (`WorkspaceRole`, `TaskStatus`, `TaskType`, `ProjectStatus`, `Priority`)
  and the `User` model into `schema.prisma`. **Add `password String`** to User (we need it for local
  auth — the reference didn't, because Clerk held passwords). First migration.
- **Learn:** Prisma models, field types, `@id`, `@default`, `@unique`; `prisma migrate dev`.
- **Done when:** `User` table exists in the DB (check with `npx prisma studio`).

### PR-6 · Workspace + WorkspaceMember models
- **Build:** add both models + the `@@unique([userId, workspaceId])`. Migrate.
- **Learn:** one-to-many and many-to-many relations; join tables; `onDelete: Cascade`.
- **Done when:** tables + foreign keys exist.

### PR-7 · Project + ProjectMember models
- **Build:** add both, including the `team_lead → User` relation and `workspaceId → Workspace`.
- **Learn:** named relations (`@relation("ProjectOwner")`), why `team_lead` is a relation not a string.
- **Done when:** migrate succeeds.

### PR-8 · Task model
- **Build:** add `Task` with its relations to Project and assignee User.
- **Learn:** enum defaults, `DateTime`, nullable vs required.
- **Done when:** migrate succeeds.

### PR-9 · Comment model
- **Build:** add `Comment`. Migrate. Schema is now complete.
- **Done when:** all 7 tables + relations exist; `prisma studio` shows the whole graph.

### PR-10 · Prisma client singleton
- **Build:** `configs/prisma.js` exporting one `PrismaClient` (standard — **no Neon adapter**). The
  `global.prisma` guard for dev hot-reload.
- **Learn:** why one shared client, not one-per-request (connection pooling — matters a lot on RDS).
- **Done when:** importing `prisma` and running `prisma.user.findMany()` returns `[]`.

### PR-11 · Seed script
- **Build:** `prisma/seed.js` that creates 3 users (with hashed passwords), one workspace, and
  memberships — adapted from the old `assets.js` dummy data.
- **Learn:** seeding; `bcryptjs` hashing; `prisma.create` / `createMany`.
- **Done when:** `node prisma/seed.js` populates the DB; `prisma studio` shows the rows.

---

# PHASE B2 — Local authentication (replacing Clerk)

> The reference outsources *all* auth to Clerk: `const { userId } = await req.auth()` appears in
> every controller. We recreate that contract locally, so every controller still just needs
> `req.userId` — meaning the controllers barely change.

### PR-12 · Password hashing helper
- **Build:** `bcryptjs` wrapper (`hash`, `compare`) in `configs/`.
- **Learn:** why passwords are hashed, never stored plain; salting.
- **Done when:** unit-test hashing a string and comparing it returns true/false correctly.

### PR-13 · Register + login endpoints
- **Build:** `POST /api/auth/register` (create user, hash password) and `POST /api/auth/login`
  (verify password, return a signed JWT). `controllers/authController.js`, `routes/authRoutes.js`.
- **Learn:** JWT — what's inside a token, signing with a secret, why it's stateless.
- **Done when:** login returns a token you can decode at jwt.io.

### PR-14 · `protect` middleware
- **Build:** `middlewares/authMiddleware.js` — read `Authorization: Bearer <token>`, verify the JWT,
  set `req.userId`. Returns 401 if missing/invalid. **This is our drop-in replacement for Clerk's
  `protect`.**
- **Learn:** auth middleware; the request lifecycle; how the reference's `req.auth()` maps to our
  `req.userId`.
- **Done when:** a protected test route returns 401 without a token, 200 with one.

### PR-15 · Adapt controllers to `req.userId`
- **Build:** decide the contract — either keep a tiny `req.auth = () => ({userId: req.userId})`
  shim (so reference controllers copy over unchanged) **or** change controllers to read `req.userId`
  directly. Pick one, document it.
- **Learn:** interface compatibility; why a shim can save rewriting 10 files.
- **Done when:** the decision is written in a comment and one controller uses it end-to-end.

---

# PHASE B3 — Workspaces

### PR-16 · `GET /api/workspaces` — the big read
- **Build:** `getUserWorkspaces` — the deeply-nested query (workspaces → members → projects → tasks →
  assignee + comments → user). Wire `routes/workspaceRoutes.js`, mount under `protect` in `server.js`.
- **Learn:** Prisma nested `include`; how one endpoint hydrates the whole frontend; the N+1 problem
  this avoids.
- **Done when:** logged in as a seeded user, the endpoint returns your workspace with everything nested.

### PR-17 · `POST /api/workspaces/add-member`
- **Build:** `addMember` — find user by email, create a `WorkspaceMember`.
- **Learn:** lookups by unique field; guarding duplicates.
- **Done when:** adding a member shows up in the next `GET /workspaces`.

---

# PHASE B4 — Projects

### PR-18 · `POST /api/projects` — create + permission check
- **Build:** `createProject`. Note the **RBAC**: only a workspace `ADMIN` may create; resolve
  `team_lead` from email; optionally attach `team_members`.
- **Learn:** role-based access control; multi-step writes; returning the hydrated project.
- **Done when:** an ADMIN can create a project; a MEMBER gets 403.

### PR-19 · `PUT /api/projects` — update
- **Build:** `updateProject`, including the "admin OR team_lead" permission branch.
- **Learn:** authorization logic with fallbacks; partial updates.
- **Done when:** the team lead can update; an unrelated member can't.

### PR-20 · `POST /api/projects/:projectId/addMember`
- **Build:** `addMember` (project-level) — only the project lead may add.
- **Learn:** route params vs body; per-resource ownership checks.
- **Done when:** lead adds a member; non-lead gets blocked.

---

# PHASE B5 — Tasks

### PR-21 · `POST /api/tasks` — create + assignee validation
- **Build:** `createTask`. Validate the assignee is a project member. *(Skip the `inngest.send`
  line for now — email comes back in PR-29.)*
- **Learn:** validating references before insert; why bad assignees must 403.
- **Done when:** creating a task with a valid assignee works; an outsider assignee is rejected.

### PR-22 · `PUT /api/tasks/:id` — update status
- **Build:** `updateTask` (this powers TODO → IN_PROGRESS → DONE).
- **Learn:** `req.body` passthrough updates and their risks (mass-assignment — note it).
- **Done when:** a task's status flips via the API and persists.

### PR-23 · `POST /api/tasks/delete` — bulk delete
- **Build:** `deleteTask` — accepts `tasksIds[]`, permission-checks, `deleteMany`.
- **Learn:** bulk ops; `where: { id: { in: [...] } }`.
- **Done when:** deleting several tasks in one call works.

---

# PHASE B6 — Comments

### PR-24 · `POST /api/comments`
- **Build:** `addComment` — must be a project member to comment.
- **Learn:** deriving permissions through relations (task → project → members).
- **Done when:** a member can comment; a non-member gets 403.

### PR-25 · `GET /api/comments/:taskId`
- **Build:** `getTaskComments`, newest included with user info.
- **Done when:** posted comments come back with author details.

---

# PHASE B7 — Hardening (cross-cutting)

### PR-26 · Central error handler + async wrapper
- **Build:** an Express error-handling middleware + an `asyncHandler` wrapper, replacing repetitive
  try/catch in controllers.
- **Learn:** DRY error handling; Express's 4-arg error middleware.
- **Done when:** a thrown error anywhere returns a clean JSON 500, no crash.

### PR-27 · Input validation
- **Build:** validate required fields on create endpoints (hand-rolled or `zod`).
- **Learn:** never trust the client; 400 vs 500.
- **Done when:** posting a project with no name returns 400, not a Prisma explosion.

### PR-28 · The DB-credentials seam (⭐ the AWS hook)
- **Build:** a `configs/db-credentials.js` that today reads `DATABASE_URL` from `.env`, but is the
  **single place** that will later fetch from AWS Secrets Manager. Everything else imports from here.
- **Learn:** isolating the thing that changes between local and cloud. *This one PR is why Phase 6 of
  the infra plan (Secrets Manager) will be a 10-line change instead of a hunt-and-replace.*
- **Done when:** nothing else in the codebase reads `DATABASE_URL` directly.

---

# PHASE B8 — Email + containerize (optional / deployment)

### PR-29 · Email on task assignment (replacing Inngest)
- **Build:** `configs/nodemailer.js`; call it directly inside `createTask` instead of
  `inngest.send`. Guard so a mail failure never fails the request.
- **Learn:** transactional email; why side-effects shouldn't block the response; SMTP creds → another
  Secrets Manager entry later.
- **Done when:** creating an assigned task sends a mail (use a test SMTP like Mailtrap).

### PR-30 · Dockerfile for local + parity
- **Build:** a `Dockerfile` for the backend and its entry in `docker-compose.yml` (alongside Postgres).
- **Learn:** containerizing a Node app; why local Docker mirrors the EC2 runtime.
- **Done when:** `docker compose up` starts Postgres + backend together and the API answers.

---

## Definition of done for the whole backend
- `docker compose up` → API live on `:5000`, talking to Postgres.
- Log in as a seeded user → `GET /api/workspaces` returns the full nested tree.
- Create project → create task → move it to DONE → comment on it → **all persist across restarts.**
- No Neon, no Clerk, no Inngest imports remain. `grep -r "clerk\|neon\|inngest" backend/src` is empty.
- One config module is the sole reader of DB credentials (ready for Secrets Manager).

## Endpoint reference (final surface)
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/workspaces
POST   /api/workspaces/add-member
POST   /api/projects
PUT    /api/projects
POST   /api/projects/:projectId/addMember
POST   /api/tasks
PUT    /api/tasks/:id
POST   /api/tasks/delete
POST   /api/comments
GET    /api/comments/:taskId
GET    /health
```
