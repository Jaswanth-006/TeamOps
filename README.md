<div align="center">

# TeamOps

**A full-stack classroom project-management platform deployed on a production-grade 3-tier AWS architecture, provisioned end to end with Terraform.**

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [System Architecture (3-Tier)](#system-architecture-3-tier)
5. [Network Topology](#network-topology)
6. [Security Model](#security-model)
7. [Request Lifecycle](#request-lifecycle)
8. [Backend — Architecture & Flow](#backend--architecture--flow)
9. [Frontend — Architecture & Flow](#frontend--architecture--flow)
10. [Database Schema](#database-schema)
11. [Infrastructure as Code](#infrastructure-as-code)
12. [Local Development](#local-development)
13. [Deploying to AWS](#deploying-to-aws)
14. [Repository Structure](#repository-structure)
15. [Documentation](#documentation)

---

## Overview

TeamOps is a project-management application built for the classroom. A **faculty** member heads a
**class** and orchestrates many student **teams** — appointing team leaders, assigning tasks,
tracking progress, and commenting across every team. Students work within the teams they belong to.

It is deployed the way real production systems are built: three **isolated network tiers** on AWS,
secure by design, highly available, auto-scaling, and defined **entirely as code**.

> The application is the workload. **The infrastructure is the deliverable.**

**Domain model**

| Classroom concept | System entity |
| :--- | :--- |
| Class | Workspace |
| Faculty (class head) | Workspace `ADMIN` |
| Team | Project |
| Team leader | Project `team_lead` |
| Student | Project member |
| Assigned work | Task |
| Discussion | Comment |

---

## Features

**Platform**
- Faculty-orchestrated hierarchy: one class → many teams → tasks → comments
- Layered **role-based access control** (faculty vs. team lead vs. student)
- Kanban task board, calendar view, analytics dashboard, class-wide overview
- Local JWT authentication (register / login / session restore)

**Cloud architecture**
- Custom **VPC**, 12 subnets across 3 Availability Zones
- Tier-to-tier **security groups**, **NAT gateway**, fully isolated database subnets
- **Public + internal load balancers**; self-healing **auto-scaling** web and app tiers
- **Multi-AZ RDS**, **Secrets Manager** + scoped **IAM** roles
- **Route 53** + **ACM** for DNS and HTTPS
- **Packer** golden AMIs for fast instance boot
- 100% **Infrastructure as Code** with Terraform (`apply` builds it, `destroy` removes it)

---

## Tech Stack

| Area | Technologies |
| :--- | :--- |
| **Frontend** | React (Vite), Redux Toolkit, React Router, Tailwind CSS, Axios, Recharts |
| **Backend** | Node.js, Express, Prisma ORM, JSON Web Tokens, bcrypt |
| **Database** | PostgreSQL (AWS RDS, Multi-AZ) |
| **Web server** | nginx (static serving + reverse proxy) |
| **Infrastructure** | Terraform, Packer |
| **AWS** | VPC, EC2, ALB, Auto Scaling, RDS, IAM, Secrets Manager, Route 53, ACM, S3, CloudWatch |
| **Tooling** | Docker, Docker Compose, Git, GitHub |

---

## System Architecture (3-Tier)

Three tiers, each in its own subnets, each reachable only from the tier in front of it.

```mermaid
graph TD
    User(("User's Browser"))
    R53["Route 53<br/>DNS"]
    ACM["ACM<br/>TLS Certificate"]

    User -->|"1 · resolve domain"| R53
    User -->|"2 · HTTPS :443"| PubALB

    subgraph VPC["AWS VPC · 10.75.0.0/16 · 3 Availability Zones"]
        direction TB

        subgraph PUB["PUBLIC SUBNETS"]
            PubALB["Public<br/>Load Balancer"]
            Bastion["Bastion Host"]
            NAT["NAT Gateway"]
        end

        subgraph WEB["WEB TIER · private subnets"]
            subgraph ASGW["Auto Scaling Group"]
                W1["nginx + React"]
                W2["nginx + React"]
            end
        end

        subgraph APP["APP TIER · private subnets"]
            IntALB["Internal<br/>Load Balancer"]
            subgraph ASGA["Auto Scaling Group"]
                A1["Express API :4000"]
                A2["Express API :4000"]
            end
        end

        subgraph DATA["DATA TIER · isolated private subnets"]
            DBP[("RDS PostgreSQL<br/>Primary")]
            DBS[("RDS PostgreSQL<br/>Standby")]
        end
    end

    SM["Secrets Manager"]

    ACM -.->|"TLS terminates"| PubALB
    PubALB -->|"3 · HTTP :80"| W1
    PubALB -->|"3 · HTTP :80"| W2
    W1 -->|"4 · proxy /api"| IntALB
    W2 -->|"4 · proxy /api"| IntALB
    IntALB -->|"5 · HTTP :4000"| A1
    IntALB -->|"5 · HTTP :4000"| A2
    A1 -.->|"6 · fetch DB creds"| SM
    A2 -.->|"6 · fetch DB creds"| SM
    A1 -->|"7 · SQL :5432"| DBP
    A2 -->|"7 · SQL :5432"| DBP
    DBP -.->|"sync replication"| DBS
    W1 -.->|"outbound only"| NAT
    A1 -.->|"outbound only"| NAT
    Bastion -.->|"SSH admin"| A1
```

| Tier | Runs | Subnets | Accepts traffic from | Public IP |
| :--- | :--- | :--- | :--- | :--- |
| **Presentation** | nginx + React build | web private | the public load balancer | No |
| **Application** | Express API | app private | the internal load balancer | No |
| **Data** | PostgreSQL (RDS) | db private (isolated) | the application tier | No |

The browser only ever reaches the public load balancer. The application tier and database have **no
public address and no route from the internet**.

---

## Network Topology

VPC `10.75.0.0/16`, carved into **12 subnets** across **3 Availability Zones**.

| Subnet group | CIDRs | Internet route | Contents |
| :--- | :--- | :--- | :--- |
| **Public** | `10.75.1-3.0/24` | Internet Gateway | Load balancer, bastion, NAT |
| **Web** (private) | `10.75.4-6.0/24` | NAT (outbound only) | nginx + React |
| **App** (private) | `10.75.7-9.0/24` | NAT (outbound only) | Express API + internal ALB |
| **Database** (private) | `10.75.10-12.0/24` | **none** | RDS PostgreSQL |

```mermaid
graph LR
    IGW["Internet Gateway"]
    NAT["NAT Gateway"]
    subgraph RT["Route Tables"]
        PubRT["Public RT<br/>0.0.0.0/0 → IGW"]
        PrivRT["Web/App RT<br/>0.0.0.0/0 → NAT"]
        DbRT["DB RT<br/>(no internet route)"]
    end
    PubRT --> IGW
    PrivRT --> NAT
    NAT --> IGW
    DbRT -.->|isolated| X["(local traffic only)"]
```

> **The key idea:** a subnet is *public* only because its route table sends `0.0.0.0/0` to the
> Internet Gateway. There is no "public" switch — it is entirely about routing.

---

## Security Model

Defense in depth. Security groups chain tier-to-tier, each rule referencing the **previous group**
(not IP ranges), so the rules survive auto-scaling as instances come and go.

```mermaid
graph LR
    NET(["Internet"]) -->|":80, :443"| ALBSG["Public ALB SG"]
    ALBSG -->|":80"| WEBSG["Web SG"]
    WEBSG -->|":80"| IALBSG["Internal ALB SG"]
    IALBSG -->|":4000"| APPSG["App SG"]
    APPSG -->|":5432"| DBSG["Database SG"]
    BAS["Bastion SG"] -.->|":22 SSH"| WEBSG
    BAS -.->|":22 SSH"| APPSG
    BAS -.->|":5432 admin"| DBSG
```

Additional controls:
- **RDS** is encrypted at rest and `publicly_accessible = false`.
- The **database password** lives in **Secrets Manager** — never in code, config, or the AMI.
- The app tier reads it via an **IAM role scoped to that one secret** (no static AWS keys anywhere).
- **TLS terminates** at the public load balancer (encryption in transit).
- Admin SSH to private instances is **only** through the bastion host.

---

## Request Lifecycle

What happens when a user clicks **Create Task**, end to end.

```mermaid
sequenceDiagram
    participant B as Browser (React)
    participant D as Route 53
    participant P as Public ALB
    participant N as nginx (Web)
    participant I as Internal ALB
    participant E as Express (App)
    participant S as Secrets Manager
    participant DB as RDS PostgreSQL

    B->>D: resolve teamops.domain
    D-->>B: public ALB address
    B->>P: POST /api/tasks (HTTPS)
    Note over P: TLS terminates (ACM cert)
    P->>N: HTTP :80 → healthy web instance
    N->>I: proxy /api/* → internal ALB
    I->>E: HTTP :4000 → healthy app instance
    Note over E,S: DB password fetched at boot via IAM role
    E->>E: verify JWT · check RBAC (canManageProject)
    E->>DB: Prisma INSERT (:5432)
    DB-->>E: created task
    E-->>B: 201 { task }
```

---

## Backend — Architecture & Flow

A layered Express application: **routes → middleware → controllers → Prisma → PostgreSQL**.

```mermaid
graph TD
    C["Client request"] --> SRV["server.js"]
    SRV --> MW1["cors + express.json"]
    MW1 --> RT["Router (/api/...)"]
    RT --> PR["protect middleware<br/>(verify JWT → req.userId)"]
    PR --> CTL["Controller<br/>(validate · authorize · act)"]
    CTL --> PERM["canManageProject()<br/>RBAC check"]
    CTL --> PRISMA["Prisma Client"]
    PRISMA --> PG[("PostgreSQL")]
    CTL --> ERR["central error handler"]
    CTL -->|"JSON response"| C
```

**Folder layout**

```
backend/
├── server.js            # app entry: middleware + route mounting
├── configs/             # prisma client, jwt, password, mailer, db-url seam
├── middlewares/         # protect (auth), asyncHandler, errorHandler
├── routes/              # auth, workspaces, projects, tasks, comments
├── controllers/         # business logic per resource
├── utils/               # permissions (canManageProject), validation
└── prisma/              # schema + migrations + seed
```

**Authentication flow**

```mermaid
graph LR
    REG["POST /auth/register"] -->|"hash password (bcrypt)"| U[("users")]
    REG -->|"sign JWT"| TOK["token"]
    LOG["POST /auth/login"] -->|"compare password"| U
    LOG -->|"sign JWT"| TOK
    REQ["protected request"] -->|"Bearer token"| PROT["protect middleware"]
    PROT -->|"verify → req.userId"| CTL["controller"]
```

**Role-based access control** — a single rule grants faculty their cross-team authority:

> `canManageProject(project, user)` = the project's **team lead** *OR* an **ADMIN** of the project's
> workspace (the faculty). Used by the task, comment, and project controllers.

**API reference**

| Method | Endpoint | Purpose | Who |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create account | anyone |
| `POST` | `/api/auth/login` | Log in, get JWT | anyone |
| `GET` | `/api/auth/me` | Current user | authenticated |
| `GET` | `/api/workspaces` | Load classes (nested tree) | member |
| `POST` | `/api/workspaces` | Create a class | authenticated (becomes faculty) |
| `POST` | `/api/workspaces/add-member` | Add a person to a class | faculty |
| `POST` | `/api/projects` | Create a team | faculty |
| `PUT` | `/api/projects` | Update a team | faculty / team lead |
| `POST` | `/api/projects/:id/addMember` | Add student to a team | faculty / team lead |
| `POST` | `/api/tasks` | Create a task | faculty / team lead |
| `PUT` | `/api/tasks/:id` | Update a task (status) | faculty / team lead |
| `POST` | `/api/tasks/delete` | Delete tasks | faculty / team lead |
| `POST` | `/api/comments` | Comment on a task | faculty / team member |
| `GET` | `/api/comments/:taskId` | List comments | member |
| `GET` | `/health` | Load-balancer health check | — |

---

## Frontend — Architecture & Flow

A React SPA. One API call (`GET /api/workspaces`) hydrates the whole UI into Redux; components read
from the store and dispatch writes back through the API.

```mermaid
graph TD
    MAIN["main.jsx"] --> PROV["Providers<br/>Router · Redux · Auth"]
    PROV --> APP["App.jsx (routes)"]
    APP --> GUARD["ProtectedRoute"]
    GUARD --> LAYOUT["Layout<br/>(Sidebar + Navbar)"]
    LAYOUT --> PAGES["Pages"]

    PAGES --> DASH["Dashboard / Class Overview"]
    PAGES --> TEAMS["Teams / Team Detail"]
    PAGES --> TASK["Task Detail"]

    LAYOUT -->|"on load"| THUNK["fetchWorkspaces thunk"]
    THUNK --> API["axios (/api)"]
    API --> STORE[("Redux store")]
    STORE -->|"useSelector"| PAGES
    PAGES -->|"create/update"| API2["axios (/api)"]
    API2 -->|"dispatch reducer"| STORE
```

**Data flow**
- **Reads:** `fetchWorkspaces` loads the nested class → teams → tasks → comments tree into Redux;
  every page derives its view from that one tree (no per-page fetching).
- **Writes:** dialogs POST/PUT to the API, then dispatch a reducer (`addProject`, `addTask`,
  `updateTask`, …) so the UI updates instantly without a refetch.
- **Auth:** an axios interceptor attaches the JWT from `localStorage` to every request; `AuthContext`
  restores the session on load via `/auth/me`.
- **The cloud-critical choice:** the client calls **relative `/api` URLs** — never a hardcoded
  backend address — so nginx proxies them and the same build runs behind a load balancer.

**Folder layout**

```
frontend/src/
├── main.jsx · App.jsx        # entry + routes
├── context/AuthContext.jsx   # JWT auth + session
├── configs/api.js            # axios instance (relative /api + token interceptor)
├── app/store.js              # Redux store
├── features/                 # workspaceSlice, themeSlice
├── pages/                    # Dashboard, ClassOverview, Projects, ProjectDetails, TaskDetails, Team, Login, Register
└── components/               # Sidebar, Navbar, dialogs, cards, charts, board, calendar
```

---

## Database Schema

Seven models with cascading relations.

```mermaid
erDiagram
    User ||--o{ WorkspaceMember : "belongs to"
    User ||--o{ Workspace : "owns"
    User ||--o{ Project : "leads"
    User ||--o{ ProjectMember : "member of"
    User ||--o{ Task : "assigned"
    User ||--o{ Comment : "authors"
    Workspace ||--o{ WorkspaceMember : "has"
    Workspace ||--o{ Project : "contains"
    Project ||--o{ ProjectMember : "has"
    Project ||--o{ Task : "contains"
    Task ||--o{ Comment : "has"

    User {
        string id PK
        string name
        string email UK
        string password
    }
    Workspace {
        string id PK
        string name
        string slug UK
        string ownerId FK
    }
    WorkspaceMember {
        string id PK
        string userId FK
        string workspaceId FK
        enum role "ADMIN | MEMBER"
    }
    Project {
        string id PK
        string name
        string team_lead FK
        string workspaceId FK
        enum status
        enum priority
        int progress
    }
    ProjectMember {
        string id PK
        string userId FK
        string projectId FK
    }
    Task {
        string id PK
        string projectId FK
        string assigneeId FK
        string title
        enum status "TODO | IN_PROGRESS | DONE"
        enum type
        enum priority
        datetime due_date
    }
    Comment {
        string id PK
        string taskId FK
        string userId FK
        string content
    }
```

---

## Infrastructure as Code

The entire AWS environment is defined in Terraform, organized into seven modules.

```mermaid
graph TD
    ROOT["main.tf (root)"] --> VPC["vpc<br/>network, subnets, IGW, NAT"]
    ROOT --> SEC["security<br/>tier-to-tier SGs"]
    ROOT --> RDS["rds<br/>PostgreSQL Multi-AZ"]
    ROOT --> SECR["secrets<br/>DB credentials"]
    ROOT --> ALB["alb<br/>public + internal LBs"]
    ROOT --> COMP["compute<br/>IAM · launch templates · ASGs · scaling"]
    ROOT --> DNS["dns<br/>Route 53 · ACM · HTTPS"]
    PACKER["packer/<br/>golden AMIs"] -.->|"pre-baked images"| COMP
```

| Module | Provisions |
| :--- | :--- |
| `vpc` | VPC, 12 subnets, Internet Gateway, NAT, route tables |
| `security` | The six tier-to-tier security groups |
| `rds` | PostgreSQL (Multi-AZ, private) + subnet group |
| `secrets` | Database credentials in Secrets Manager |
| `alb` | Public (internet-facing) + internal load balancers |
| `compute` | IAM role/profile, launch templates, Auto Scaling Groups, scaling policies |
| `dns` | Route 53 alias record, ACM certificate, HTTPS listener |

State is stored remotely in **S3** with locking. **Packer** builds the golden AMIs the launch
templates use.

---

## Local Development

Requirements: Docker and Node.js 22.

```bash
# Start the full stack (PostgreSQL + backend + frontend)
docker compose up

# Seed sample data (first run, in another terminal)
cd backend && npm run seed
```

App: `http://localhost:8080`. For frontend hot-reload:

```bash
cd frontend && npm run dev
```

`docker-compose.yml` runs all three tiers as containers — a local mirror of the cloud architecture
(nginx → backend → PostgreSQL, the backend reaching the database by service name just as it reaches
RDS on AWS).

---

## Deploying to AWS

```bash
# 1 · Build golden AMIs (once)
cd packer/web && packer init . && packer build .
cd ../app     && packer init . && packer build .

# 2 · Provision the infrastructure
cd infrastructure
terraform init
terraform plan  -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
terraform output site_url            # live HTTPS URL

# Tear down when finished (stops the bill)
terraform destroy -var-file=dev.tfvars
```

One-time prerequisites: an S3 bucket for state, an EC2 key pair, and a Route 53 hosted zone — see
[`infrastructure/README.md`](infrastructure/README.md).

> **Cost:** the full stack left running is ~$160/month (NAT + 2 ALBs + Multi-AZ RDS + EC2, billed
> hourly). The strategy is `terraform destroy` after every session — a working session costs ~$1–2.

---

## Repository Structure

```
TeamOps/
├── frontend/         React app — API-driven, served by nginx
├── backend/          Express + Prisma REST API
├── infrastructure/   Terraform — the 3-tier AWS stack (7 modules)
├── packer/           Golden-AMI templates for the web and app tiers
├── docs/             Architecture, concept guides, report, and build logs
├── docker-compose.yml
└── README.md
```

---

## Documentation

| Document | Purpose |
| :--- | :--- |
| [End-to-End Documentation](docs/END-TO-END.md) | The whole project in one place |
| [Project Report](docs/project-report.md) | Report / presentation content |
| [3-Tier Architecture Explained](docs/3-tier-explained.md) | The architecture in plain words |
| [DevOps Concepts Guide](docs/devops-guide.md) | Every component, concept by concept |
| [Infrastructure Deep Dive](docs/infra-deep-dive.md) | Every AWS service from first principles |
| [Architecture & Requirements](docs/02-architecture.md) | Network, security, request path |

---

<div align="center">
<sub>Built for Introduction to Cloud Computing · Semester 5</sub>
</div>
