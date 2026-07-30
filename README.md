# TeamOps

Deploying the **Team Flow** project-management app on a **3-tier AWS architecture**, provisioned
entirely with Terraform. A learning project for Introduction to Cloud Computing.

> The infrastructure is the deliverable. The app is the workload it carries.

## Repository layout

| Folder | Contents |
|---|---|
| `frontend/` | Team Flow React app (ported, API-driven) |
| `backend/` | Express + Prisma API |
| `infrastructure/` | Terraform — the graded work |
| `packer/` | AMI build templates |
| `docs/` | PRD, architecture, requirements, video guide |
| `reference/` | The original cloned repos — read-only reference, never built |

## Documentation

- [Project Requirements (PRD)](docs/00-PRD.md) — the full end-to-end proposal
- [Requirements](docs/01-requirements.md) — scope, goals, non-goals
- [Architecture](docs/02-architecture.md) — network, security, request path
- [Build Plan](PLAN.md) — the 10 phases
- [Video Guide](docs/video-guide.md) — which tutorial to watch per phase

## Status

Phase 0 — Foundation. Setting up repo, tooling, and AWS account.
