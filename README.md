# TeamOps

A full-stack project-management application deployed on a **3-tier AWS architecture**, provisioned
entirely with **Terraform**. Built for Introduction to Cloud Computing.

> The infrastructure is the deliverable. The app is the workload it carries.

The app runs as a **faculty-orchestrated classroom platform**: a faculty member heads a class and
oversees many student team projects — assigning tasks, tracking progress, and commenting across
every team.

## Repository layout

| Folder | Contents |
|---|---|
| `frontend/` | React (Vite) app — API-driven, served by nginx |
| `backend/` | Express + Prisma API (PostgreSQL) |
| `infrastructure/` | Terraform — the 3-tier AWS stack (7 modules) |
| `packer/` | AMI build templates (planned — see roadmap Phase 8) |
| `docs/` | Architecture, concepts, report, and build plans |
| `docker-compose.yml` | Local stack: nginx + backend + PostgreSQL |

## Documentation

**Start here**
- [End-to-End Documentation](docs/END-TO-END.md) — the whole project in one place: app, architecture, request flow, deployment

**Concepts & report**
- [Project Report / PPT content](docs/project-report.md) — intro, problem, objectives, methodology, conclusion
- [3-Tier Architecture, Explained](docs/3-tier-explained.md) — the big picture in plain words
- [DevOps Concepts Guide](docs/devops-guide.md) — every component, concept by concept
- [Infrastructure Deep Dive](docs/infra-deep-dive.md) — every service from first principles

**Design**
- [Project Requirements (PRD)](docs/00-PRD.md)
- [Requirements](docs/01-requirements.md) · [Architecture](docs/02-architecture.md)

**Build plans (PR-by-PR)**
- [Backend](docs/backend-implementation.md) · [Frontend](docs/frontend-implementation.md) · [Infrastructure](docs/infrastructure-implementation.md)
- [Faculty Mode](docs/faculty-mode-implementation.md)
- [Infrastructure Roadmap](docs/infrastructure-roadmap.md) · [Build Plan](PLAN.md)

## Status

- **Backend** — complete (auth, workspaces/classes, projects/teams, tasks, comments, RBAC).
- **Frontend** — complete (dashboard, teams, tasks, comments, class overview, faculty mode).
- **Infrastructure** — full 3-tier stack authored in Terraform (VPC, security groups, RDS,
  Secrets Manager, two ALBs, auto-scaling, Route 53 + HTTPS). Not yet applied to a live account.

## Running locally

```bash
docker compose up        # PostgreSQL + backend + frontend
cd backend && npm run seed   # seed sample data (first run)
```

Frontend dev server: `cd frontend && npm run dev`.
