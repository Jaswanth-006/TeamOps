# Infrastructure — PR-by-PR Implementation Plan

Build the TeamOps 3-tier AWS infrastructure in `infrastructure/` **as Terraform code**, one small
PR at a time. We **write** the code (not `apply` it), so there is no AWS account or cost involved —
the value is understanding every resource. The reference `3-tier/` folder is read-only: consult it
when stuck, never copy it wholesale.

## Golden rules

1. **Understand every resource.** For each PR, know what the resource *is*, why it exists, and what
   would happen on `apply`. If you can't explain it, don't keep it.
2. **Write it yourself; steal only boilerplate.** VPC, security groups, ALBs, ASG, RDS, IAM — write
   these by hand (they're the viva). Provider blocks and `.gitignore` you can lift.
3. **One concept per PR.** The git log becomes your revision notes.
4. **Never commit state or secrets.** `.gitignore` blocks `*.tfstate`, `.terraform/`, `*.tfvars`
   with real values. `dev.tfvars` here holds only non-secret placeholders.

## What we're building (from `docs/00-PRD.md`)

VPC `10.75.0.0/16`, 12 subnets across 3 AZs (public / web / app / db), an internet gateway, a NAT
gateway, security groups chained tier-to-tier, a public ALB → web tier, an internal ALB → app tier,
Multi-AZ RDS PostgreSQL, Secrets Manager + IAM, Auto Scaling Groups, and Route 53 + ACM for HTTPS.

## Target file structure

```
infrastructure/
├── versions.tf          # required terraform + provider versions
├── providers.tf         # AWS provider
├── backend.tf           # S3 remote state
├── variables.tf         # input variables
├── dev.tfvars           # dev values (no secrets)
├── data.tf              # AMI / AZ / ACM lookups
├── main.tf              # module composition
├── outputs.tf           # top-level outputs
└── modules/
    ├── vpc/             # VPC, subnets, IGW, NAT, route tables
    ├── security/        # security groups
    ├── rds/             # PostgreSQL + subnet group
    ├── secrets/         # Secrets Manager
    ├── alb/             # public + internal load balancers
    ├── compute/         # IAM, launch templates, ASGs, scaling
    └── dns/             # Route 53 + ACM + HTTPS
```

---

# GROUP I0 — Terraform foundations

### PR-1 · Scaffold `infrastructure/`
- **Build:** `versions.tf` (terraform + AWS provider version pins), `providers.tf` (region from a
  variable), `.gitignore` (`.terraform/`, `*.tfstate*`, `*.tfvars` except example). A minimal
  `variables.tf` with `region`.
- **Learn:** the `terraform {}` block, `required_providers`, the provider block.
- **Done when:** the files exist and read as a valid, if empty, Terraform root.

### PR-2 · Input variables + `dev.tfvars`
- **Build:** declare the project's variables (region, VPC CIDR, subnet CIDR lists, instance sizes,
  DB settings, capacities, domain). Add `dev.tfvars` with non-secret values from the PRD.
- **Learn:** variable types (`string`, `list(string)`, `number`, `bool`), `.tfvars`, sensitive vars.
- **Done when:** every value the modules will need has a declared variable.

### PR-3 · S3 remote backend
- **Build:** `backend.tf` configuring an S3 backend for state, with a documented note that the bucket
  is created once by hand (or a bootstrap) before `init`.
- **Learn:** what Terraform **state** is, why remote state + locking matters, why local state is risky.
- **Done when:** the backend block is present and documented.

---

# GROUP I1 — Networking (the `vpc` module)

### PR-4 · The VPC
- **Build:** `modules/vpc` with the `aws_vpc` resource, DNS support on, plus the module's
  `variables.tf` and `outputs.tf` (exporting the VPC id).
- **Learn:** VPC, CIDR blocks, module inputs/outputs.

### PR-5 · Subnets across AZs
- **Build:** the four subnet groups (public, web, app, db) created with `count`/`for_each` over the
  CIDR lists, each in a different AZ via a `data.aws_availability_zones` lookup.
- **Learn:** subnets, AZ spreading, `count` vs `for_each`, data sources.

### PR-6 · Internet Gateway + public routing
- **Build:** an `aws_internet_gateway`, a public route table with `0.0.0.0/0 → igw`, and associations
  for the public subnets.
- **Learn:** IGW, route tables, why a subnet is "public" only via its route table.

### PR-7 · NAT Gateway + private routing
- **Build:** an Elastic IP, a NAT gateway in a public subnet, private route tables with
  `0.0.0.0/0 → nat` for web and app subnets, and **no** internet route for the db subnets.
- **Learn:** NAT (outbound-only), why the db tier has no internet route at all.

### PR-8 · Compose the VPC in root
- **Build:** call `module "vpc"` from `main.tf`, wire variables, surface key outputs (subnet ids).
- **Done when:** the root references the vpc module and exposes its subnet ids.

---

# GROUP I2 — Security groups (the `security` module)

### PR-9 · Bastion + public ALB security groups
- **Build:** `bastion_sg` (SSH from an allowed IP) and `alb_sg` (80/443 from the internet).
- **Learn:** ingress/egress, CIDR sources.

### PR-10 · Web + internal-ALB security groups
- **Build:** `web_sg` (80 from `alb_sg`, 22 from `bastion_sg`) and `app_alb_sg` (80 from `web_sg`).
- **Learn:** **security groups referencing other security groups** — the core pattern.

### PR-11 · App + DB security groups
- **Build:** `app_sg` (4000 from `app_alb_sg`, 22 from `bastion_sg`) and `db_sg` (5432 from `app_sg`
  and from `bastion_sg`).
- **Learn:** the full tier-to-tier chain; least privilege.

### PR-12 · Compose security in root
- **Build:** call `module "security"`, pass the VPC id, surface SG id outputs.

---

# GROUP I3 — Data tier

### PR-13 · RDS PostgreSQL
- **Build:** `modules/rds` — a DB subnet group over the db subnets and an `aws_db_instance`
  (postgres, Multi-AZ, `publicly_accessible = false`, in `db_sg`).
- **Learn:** RDS, subnet groups, Multi-AZ, the `publicly_accessible` flag.

### PR-14 · Secrets Manager
- **Build:** `modules/secrets` — an `aws_secretsmanager_secret` + version holding
  `{ username, password, host, port, dbname }`, sourced from the RDS outputs.
- **Learn:** Secrets Manager; why credentials leave `.tfvars` and live here.

### PR-15 · Compose data tier
- **Build:** wire `module "rds"` and `module "secrets"` in root, ordered with `depends_on`.

---

# GROUP I4 — Load balancers (the `alb` module)

### PR-16 · Public ALB → web tier
- **Build:** `modules/alb` — an internet-facing ALB in the public subnets, a target group (port 80,
  health check `/`), an HTTP listener.
- **Learn:** ALB, target groups, listeners, health checks.

### PR-17 · Internal ALB → app tier
- **Build:** an **internal** ALB in the app subnets, a target group (port 4000, health check
  `/health`), an HTTP listener.
- **Learn:** internet-facing vs internal load balancers.

### PR-18 · Compose ALBs
- **Build:** wire `module "alb"`, surface the ALB DNS names as outputs.

---

# GROUP I5 — Compute (the `compute` module)

### PR-19 · IAM role + instance profile
- **Build:** an IAM role for the app instances, a policy allowing `secretsmanager:GetSecretValue`
  **scoped to the one secret ARN**, and an instance profile.
- **Learn:** IAM roles vs users, instance profiles, least privilege (not `Resource = "*"`).

### PR-20 · Launch templates + user data
- **Build:** launch templates for the web and app tiers (AMI via `data.aws_ami`, instance type, SGs,
  key, `user_data` that clones the repo, builds, and starts the service; app tier reads its secret).
- **Learn:** launch templates, `user_data` / cloud-init, `templatefile()`.

### PR-21 · Auto Scaling Groups
- **Build:** ASGs for both tiers across the private subnets, attached to their target groups, with
  desired/min/max and a rolling instance-refresh.
- **Learn:** ASGs, target-group attachment, self-healing.

### PR-22 · Scaling policies
- **Build:** target-tracking scaling policies on CPU for both tiers.
- **Learn:** scaling policies, CloudWatch-driven scaling.

### PR-23 · Compose compute
- **Build:** wire `module "compute"`, passing subnets, SGs, target groups, the secret ARN, AMIs.

---

# GROUP I6 — DNS + TLS

### PR-24 · Route 53 + ACM + HTTPS
- **Build:** `modules/dns` — a Route 53 alias record → the public ALB, an ACM certificate lookup,
  and an HTTPS (443) listener on the public ALB using the cert. Wire it in root.
- **Learn:** DNS alias records, ACM, TLS termination at the ALB.

### PR-25 · Final outputs + README
- **Build:** top-level outputs (site URL, ALB DNS, RDS endpoint, bastion IP) and an
  `infrastructure/README.md` describing prerequisites (S3 state bucket, ACM cert, key pair, AMIs) and
  the `init → plan → apply → destroy` workflow.

---

## Definition of done for the infrastructure

- `infrastructure/` reads as a complete, modular Terraform project that *would* provision the full
  3-tier architecture from an empty account (given the documented prerequisites).
- No state files, no real secrets committed.
- Every module has clear `variables.tf` / `outputs.tf`, and every resource is explainable.
- The README documents how it would be applied and destroyed.

## Note on verification

We are not running `terraform apply` (by design — no account, no cost). Where Terraform is installed,
each PR can be checked with `terraform fmt` and `terraform validate`. Where it isn't, PRs are written
carefully and reviewed by reading; a validate pass can be run later once tooling is available.
