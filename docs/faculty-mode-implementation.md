# Faculty Mode — Implementation Plan

Adapting TeamOps into a **faculty-orchestrated classroom platform**: a faculty member heads a class
and oversees many student team projects (e.g. 16 teams) — assigning tasks, updating them, and
commenting across every team, at a high level.

## The mapping (no schema change needed)

| Classroom concept | TeamOps model |
|---|---|
| Class | Workspace |
| Faculty (class head) | Workspace **ADMIN** |
| Team | Project |
| Team leader | Project `team_lead` |
| Team members | Project members |
| Work assigned to a team | Tasks in that team's project |
| Discussion | Comments on tasks |

## Design decisions

- **Reuse the `ADMIN` role as "Faculty"** — no enum/schema migration.
- **Faculty-created tasks** are assigned to a team member or the team lead — the assignee check is
  widened to allow the lead.
- **Relabel in the UI only** (Class / Team / Faculty) — data model unchanged.
- **Add a class-overview screen** for faculty — powered by the existing nested workspace read.

## The one real gap being closed

Today, authority over a team's tasks/comments belongs only to that project's `team_lead`. A workspace
**ADMIN (faculty)** has no cross-team power. Faculty Mode extends every management check from
*"is this the team lead?"* to *"is this the team lead **or** an admin of this project's workspace?"*

---

## Backend PRs

### FM-1 · Project-management permission helper
- **Build:** `backend/utils/permissions.js` exporting `canManageProject(project, userId)` → true if the
  user is the project's `team_lead` **or** an `ADMIN` of the project's workspace.
- **Why:** one shared rule so faculty authority is defined in a single place, used by every controller.
- **Done when:** the helper exists and reads the workspace membership to check the admin role.

### FM-2 · Extend task RBAC to faculty
- **Build:** in `taskController`, replace the `team_lead`-only checks in `createTask`, `updateTask`,
  and `deleteTask` with `canManageProject`. Widen the create-task assignee check to also allow the
  team lead.
- **Why:** faculty can give tasks to any team, update them, and remove them — the core of the shift.
- **Done when:** a workspace admin can create/update/delete tasks in any project of their workspace.

### FM-3 · Extend comment + project-member RBAC to faculty
- **Build:** in `commentController.addComment`, allow a project manager (lead/faculty) in addition to
  project members. In `projectController.addMember`, replace the `team_lead`-only check with
  `canManageProject`.
- **Why:** faculty can comment on any team's tasks and add students to any team.
- **Done when:** a workspace admin can comment on, and add members to, any project in their workspace.

## Frontend PRs

### FM-4 · Relabel UI to Class / Team / Faculty
- **Build:** update visible labels — "Workspace" → "Class", "Projects" → "Teams", "Project" → "Team",
  role "ADMIN" → "Faculty", "Team lead" wording — across sidebar, navbar, pages, and dialogs. No data
  or route changes.
- **Why:** the interface reads as a classroom platform for the demo.
- **Done when:** the app presents as Class / Team / Faculty throughout.

### FM-5 · Faculty class-overview screen
- **Build:** a class overview showing every team at a glance — team name, leader, member count, task
  progress, status — derived from the already-loaded workspace tree. Link each to its team detail.
- **Why:** faculty need a high-level view of all 16 teams in one place.
- **Done when:** faculty see a single screen summarizing every team in the class.

---

## Definition of done
- A faculty user (workspace admin) can, across **every** team in their class: create/update/delete
  tasks, comment on tasks, and add members — not just teams they personally lead.
- The UI presents as Class / Team / Faculty.
- A class-overview screen summarizes all teams.
- No database migration required.

## Note on verification
Node/Docker are unavailable this session (post-reinstall), so these PRs are written carefully but not
build/test-verified. Re-verify with `npm run build` (frontend) and the backend integration checks
once tooling is restored.
