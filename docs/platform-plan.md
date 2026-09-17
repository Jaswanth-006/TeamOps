# TeamOps Platform Plan — Classroom Layer + Full Student Experience

The plan before we build. Goal: keep the **complete original project-management experience** for
students (task board, chat/discussion, my-tasks, analytics, calendar) and add a **class layer**
handled by faculty on top of it.

> Status: PLAN — for review. No code changes until this is agreed.

---

## 1. The vision in one line

The original app was a single project-management workspace. We turn it into a **multi-class
platform**: a faculty member owns a **class** and orchestrates many student **teams**; inside each
team, students get the full original experience.

```
Faculty ──owns──> Class ──contains──> Teams ──contain──> Tasks ──have──> Discussion (chat)
                                        │
                                        └── Students (leader + members)
```

---

## 2. Roles & permissions

Three roles. The class layer is faculty; the team layer is leader; the member is a participant.

| Capability | Faculty | Student — Team Lead | Student — Member |
| :--- | :---: | :---: | :---: |
| Create / manage a **class** | ✅ | — | — |
| Add people to the **class** | ✅ | — | — |
| See **all teams** in the class | ✅ | own team only | own team only |
| Create a **team** | ✅ | — | — |
| Add members to a **team** | ✅ | ✅ (own team) | — |
| Create / assign **tasks** | ✅ | ✅ (own team) | — |
| Update / delete **tasks** | ✅ | ✅ (own team) | — |
| Edit **team settings** | ✅ | ✅ (own team) | — |
| View team board, analytics, calendar | ✅ | ✅ | ✅ |
| **My Tasks** (their assigned work) | ✅ | ✅ | ✅ |
| **Comment / chat** on a task | ✅ | ✅ | ✅ |
| Update **status of a task assigned to them** | ✅ | ✅ | **decision — see §6** |

Everything a **member** can do = the full student app *except* the leader actions (assigning tasks,
adding members, editing settings). Leaders get member abilities **plus** those team-admin actions.

---

## 3. Full feature catalog (from the original) — what students get

Every feature below existed in the original clone and is what students should have:

| Feature | In original | In current build | Action |
| :--- | :---: | :---: | :--- |
| Sidebar navigation | ✅ | ✅ (basic) | enhance |
| **Projects sidebar** (collapsible team tree → Tasks/Analytics/Calendar/Settings) | ✅ | ❌ | **build** |
| **My Tasks sidebar** (your assigned tasks across teams, status dots) | ✅ | ❌ | **build** |
| Dashboard (stats, task summary, recent activity) | ✅ | ✅ | keep |
| Project analytics charts | ✅ | ✅ (in Overview) | split into its own tab |
| Team board (Kanban: To-Do / In-Progress / Done) | ✅ | ✅ | keep |
| Team calendar (tasks on due dates) | ✅ | ✅ | keep |
| Team overview + settings | ✅ | ✅ | keep |
| Create task dialog (assignee, type, priority, due date) | ✅ | ✅ | keep |
| **Task detail = chat window** (2-column: discussion chat-bubbles + task/project info) | ✅ | ❌ (plain list) | **rebuild rich** |
| Comments with avatars, timestamps, own-vs-others alignment, live refresh | ✅ | partial | **enhance** |
| Team members list | ✅ | ✅ | keep |

**The four real gaps to build:** Projects sidebar, My Tasks sidebar, the rich chat-style Task
detail, and a dedicated Analytics tab.

---

## 4. What's already done (from the recent work)

- **Class layer:** faculty can create a class (workspace) and add people. ✅
- **Teams:** faculty create teams and appoint a leader; leader/faculty add team members. ✅
- **Role model in the backend:** `canManageProject` = team lead OR faculty; enforced on tasks,
  comments, and team-member actions. ✅ (verified: students get 403 on other teams)
- **Role-scoped visibility:** students see only their team(s); faculty sees all. ✅
- **Role-aware UI:** Faculty/Student badge; management buttons hidden from members. ✅

So the **platform skeleton and permissions are in place.** What remains is restoring the **full
student richness** from the original (sidebars + chat) on top of it.

---

## 5. Implementation plan (grouped)

### Group A — Student navigation (the two sidebars)
- **A1 · Projects sidebar** — collapsible team tree in the sidebar; each team expands to Tasks /
  Analytics / Calendar / Settings, deep-linking into the team detail tab. (Faculty: all teams;
  student: their team.)
- **A2 · My Tasks sidebar** — a collapsible "My Tasks" panel listing every task assigned to the
  current user across their teams, with status dots, linking to the task detail.
- **A3 · Wire both into the Sidebar** below the main nav.

### Group B — The task chat window
- **B1 · Rebuild TaskDetails** as the 2-column layout: left = discussion (chat bubbles, avatars,
  timestamps, own-messages aligned right, input box); right = task info + project info cards.
- **B2 · Live comments** — load on open and poll every ~10s so new messages appear (the original's
  behaviour), wired to the real comments API.
- **B3 · Keep role gating** — status controls / delete only for faculty or team lead; commenting
  open to all team members.

### Group C — Team detail tabs
- **C1 · Split Analytics into its own tab** (Tasks / Analytics / Calendar / Overview / Settings),
  matching the original, deep-linkable by `?tab=`.

### Group D — Polish
- **D1 · Avatars** — the original used profile images; we can use initials-based avatars (no image
  uploads needed) so comments and assignees show a face.
- **D2 · Empty/loading states** consistent across the student views.

Each item is a small PR (built and tested in Docker, since Node isn't installed locally).

---

## 6. Open decisions (need your call before building)

1. **Can a member update the status of a task assigned to *them*?**
   - *Option A (stricter):* No — only the lead/faculty move tasks. (Current behaviour.)
   - *Option B (typical):* Yes — an assignee can move their own task TODO → IN_PROGRESS → DONE, but
     can't touch others'. Most task tools work this way and it makes the member experience real.
   - **Recommendation:** Option B — it's what makes the student view feel like the original app.

2. **Avatars** — real uploaded images (needs storage) or **auto-generated initials avatars**
   (no uploads, works offline)?
   - **Recommendation:** initials avatars — zero infra, looks clean.

3. **"Chat" scope** — the original's only chat is the **per-task discussion**. Is that what you mean
   by "chat window," or do you also want a **team-wide chat** (not in the original)?
   - **Recommendation:** per-task discussion (matches the original); team-wide chat is a separate
     future feature.

---

## 7. Suggested build order

1. Confirm the three decisions in §6.
2. **Group B** (the chat window) — the feature you called out specifically.
3. **Group A** (the two sidebars) — the biggest visible restoration of the original.
4. **Group C** (analytics tab), then **Group D** (polish).

Once you confirm §6, I'll build these as small, Docker-verified PRs — nothing else changes about the
class/faculty layer, which already works.
