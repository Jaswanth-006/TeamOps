# TeamOps — Requirements

**Course:** Introduction to Cloud Computing (Sem 5)
**Deliverable:** a project-management web application deployed on a 3-tier AWS architecture,
provisioned entirely as code.
**Evaluation:** mid-eval. **The infrastructure is what is graded.**

---

## 1. What we are building

**TeamOps** — the *Team Flow* project-management app (workspaces → projects → tasks → comments),
running on AWS across three isolated network tiers, with every AWS resource created by Terraform.

The application is the **vehicle**. The infrastructure is the **product**. Every scoping decision
in this document follows from that one sentence.

---

## 2. Goals

**G1 — A working 3-tier deployment.** Presentation, application, and data tiers in separate
subnets, with traffic strictly funnelled through load balancers.

**G2 — Nothing created by hand.** `terraform apply` builds the entire stack from nothing;
`terraform destroy` removes it. Repeatable, from zero, every time.

**G3 — The database is unreachable from the internet.** Not "password protected" — *unroutable*.
No public IP, no internet gateway route, inbound traffic only from the app tier's security group.

**G4 — No credentials in source code.** The app fetches its database password from AWS Secrets
Manager at boot, authorised by an IAM instance profile.

**G5 — It survives failure.** Kill an instance; the Auto Scaling Group replaces it and the app
stays up. Multi-AZ RDS survives an availability-zone outage.

**G6 — I can defend every line of it.** If I can't explain why a resource exists, it doesn't
go in.

---

## 3. Non-goals

Stated explicitly so they don't quietly eat effort that belongs on the infrastructure:

- **Not building a real product.** No user signup, no password hashing, no sessions. The
  frontend hardcodes `user_1` and that is *fine* — auth is not on the marksheet.
- **Not rewriting the frontend.** Team Flow's React UI already exists. It gets ported and its
  data layer swapped from Redux dummies to API calls. Nothing more.
- **Not chasing production-grade security.** No WAF, no GuardDuty, no VPC flow logs, no
  encryption-at-rest tuning. Correct network isolation, yes. Compliance theatre, no.
- **Not optimising cost.** $300 of credit, destroyed between sessions. Move on.
- **Not doing CI/CD.** A GitHub Actions pipeline is a different subject. Deploy from the laptop.
- **Not containerising to ECS/EKS.** The requirement is a 3-tier *EC2* architecture. Docker is
  used for local development only.

---

## 4. Functional requirements (application)

Deliberately minimal — just enough to *prove the data path works end to end*.

| # | Requirement | Why it exists |
|---|---|---|
| F1 | List workspaces, projects, tasks | Proves read path: browser → ALB → nginx → internal ALB → Express → RDS |
| F2 | Create a project | Proves the write path |
| F3 | Create a task | Proves the write path against a related table |
| F4 | Update a task's status (TODO → IN_PROGRESS → DONE) | Proves UPDATE, and it demos well |
| F5 | Post a comment on a task | Proves a second-level relation |
| F6 | Data persists across a browser refresh | **The single proof that it's a real database and not React state** |

Anything beyond this list is optional and gets built only once the infrastructure core is done.

---

## 5. Infrastructure requirements (the graded work)

| # | Requirement |
|---|---|
| I1 | Custom VPC — not the default one |
| I2 | Public subnets (ALB + bastion), private web / app / db subnets, across multiple AZs |
| I3 | Internet Gateway for public subnets; NAT Gateway for private-subnet egress |
| I4 | Security groups chained tier-to-tier: each tier accepts traffic **only** from the tier above it, by security-group reference — never by CIDR |
| I5 | Internet-facing ALB → web tier |
| I6 | **Internal** ALB → app tier (not internet-facing) |
| I7 | nginx on the web tier serves the React build and reverse-proxies `/api/*` to the internal ALB |
| I8 | Auto Scaling Groups for both the web and app tiers |
| I9 | RDS PostgreSQL, Multi-AZ, in private subnets, `publicly_accessible = false` |
| I10 | AWS Secrets Manager for DB credentials + IAM instance profile to read them |
| I11 | Bastion host — the only SSH entry point to private instances |
| I12 | Terraform remote state in S3, with locking |
| I13 | Packer-built AMIs *(cuttable — see PLAN.md)* |
| I14 | Route 53 + ACM + HTTPS *(cuttable)* |

---

## 6. Constraints

- **Budget:** $300 AWS credit. Requires `terraform destroy` after every session
  (NAT Gateway and ALBs bill hourly, ~$160/month if left running).
- **Solo project.** No one to hand the backend to.
- **Learning from zero.** No prior AWS, Terraform, or DevOps experience. The plan is sequenced
  around this — see `PLAN.md`.

---

## 7. Success criteria

The project is done when all of these are true:

1. `terraform apply` on an empty AWS account produces a working, publicly reachable Team Flow.
2. Creating a project in the browser writes a row to RDS, and it survives a refresh.
3. The RDS instance has no public IP and cannot be reached from the internet — demonstrably.
4. `grep -r password infrastructure/` finds no database password. It's in Secrets Manager.
5. Manually terminating an app instance does not take the site down.
6. `terraform destroy` leaves the account clean, and the bill stops.
7. I can answer every question in the viva list (see `PLAN.md`, Phase 10) without notes.

---

## 8. Out of scope, revisited

If you find yourself building any of the following, stop — you are avoiding the hard part:
email notifications, drag-and-drop kanban polish, dark-mode tweaks, user avatars, real-time
updates, a mobile view, or "just one more" React component.

**The marks are in the VPC.**
