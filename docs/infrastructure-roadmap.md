# Infrastructure Roadmap — The Main Project

This is the plan for **after the frontend is done**. Everything built so far (backend, frontend,
Docker) was preparation: a deployable app for the infrastructure to carry. **This document is the
actual graded project** — deploying TeamOps onto a 3-tier AWS architecture, provisioned as code.

> Read `docs/00-PRD.md` for the architecture and `PLAN.md` for the phase list. This file is the
> detailed, step-by-step version of Phases 2–10.

---

## Where we are before starting

The app is ready to deploy, and specific choices were made to make deployment cheap:

| Already built | Why it matters for the cloud |
|---|---|
| Backend runs on `docker compose up`, connects to Postgres **by network address** | Mirrors EC2 → RDS exactly |
| `GET /health` endpoint | The target for ALB health checks |
| DB credentials read from **one config module** (`configs/databaseUrl.js`) | Secrets Manager is a ~10-line change in one file (Phase 6) |
| Backend runs `prisma migrate deploy` on start | The app tier brings a fresh RDS up to schema automatically |
| Frontend calls **relative `/api`** URLs | nginx on the web tier proxies to the app tier — no hardcoded backend address |
| Frontend `npm run build` → static `dist/` | What nginx serves on the web tier |

Nothing in the app needs to change to deploy it. That was the point.

---

## The mental model

Three tiers, each in its own subnets, each reachable only from the tier above:

```
Internet → Public ALB → Web tier (nginx + React) → Internal ALB → App tier (Express) → RDS (Postgres)
```

- The **browser** only reaches the public ALB.
- **nginx** serves the React build and proxies `/api/*` down to the internal ALB.
- The **app tier** is the only thing that can open a connection to the database.
- The **database** has no route to the internet at all.

Everything below builds this, piece by piece.

---

# PHASE 2 — Build AWS by hand ⭐ (do not skip)

**Goal:** understand every resource by creating it in the console, then delete it all. No Terraform.

**Why this is the most important phase:** Terraform is a tool for creating AWS resources. If you
don't know what the resources *are*, Terraform is just YAML that sometimes works. One afternoon
here makes every `.tf` file afterward read like plain English — and it's where your viva answers
come from.

**Do these in order — each step exists to make you feel the problem the next one solves:**

1. Launch a `t3.micro` EC2 in the default VPC. SSH into it. → *EC2, AMIs, key pairs, security groups.*
2. Install Node, run the backend on it, open port 5000, hit it from your browser. → *SG ingress rules.*
3. Build your **own** VPC: CIDR block → one public subnet → Internet Gateway → route table → launch an EC2 in it. → *VPC, subnets, IGW, route tables.*
4. Add a **private** subnet + an EC2 in it. Try to SSH — you can't. Add a **bastion** in the public subnet and SSH *through* it. → *private subnets, bastion hosts, SGs referencing SGs.*
5. On the private instance, run `npm install` — it hangs forever (no internet). Add a **NAT Gateway**. → *NAT = outbound-only internet.*
6. Launch **RDS PostgreSQL** in private subnets. Connect with `psql` from the bastion. → *RDS, DB subnet groups, Multi-AZ.*
7. **Delete all of it, by hand.** Forty clicks. → *why Terraform exists.*

**The one sentence that unlocks VPC:** a subnet is "public" *only* because its route table sends
`0.0.0.0/0` to an Internet Gateway. There is no checkbox. That is the entire difference.

✅ **Done when:** you can draw the VPC on paper from memory and explain out loud why the private
instance needed a NAT Gateway but the public one didn't.

---

# PHASE 3 — Terraform: rebuild the VPC as code

**Goal:** automate what you just built by hand. **Zero new AWS services** — this phase is purely
about the tool.

Steps:
1. Provision one **S3 bucket**. Nothing else. Run `init` → `plan` → `apply` → `destroy`. → *HCL, providers, resources, the state file.*
2. The **VPC**, all values hardcoded. → *resource references, implicit dependencies.*
3. Pull values into `variables.tf` + `dev.tfvars`. → *variables, types, outputs.*
4. 3 subnets across 3 AZs without copy-paste. → *`count` / `for_each`, `data` sources.*

**Prerequisite knowledge:** Phase 2 (you must know what a subnet *is*). Watch Piyush videos 1, 2, 3,
5, 6, 8, 13 alongside (see `docs/video-guide.md`).

✅ **Done when:** `terraform apply` builds your VPC from nothing and `terraform destroy` removes it,
repeatably.

---

# PHASE 4 — Get the app onto AWS (one instance)

**Goal:** the app runs in the cloud, deployed by a single command.

Steps:
1. Security groups in Terraform.
2. An EC2 with a **`user_data`** script that installs and starts the backend on boot. → *cloud-init, `templatefile()`.*
3. **RDS** in Terraform.
4. Move Terraform **state to an S3 backend**. → *remote state, locking, why local state is dangerous.*
5. Refactor into **modules**: `modules/vpc`, `modules/sg`, `modules/ec2`, `modules/rds`. → *modules, inputs, outputs.*

✅ **Done when:** `terraform apply` from nothing → TeamOps is reachable on an EC2 public IP →
`terraform destroy` → gone.

> Your Terraform will be uglier than the reference repo's `3-tier/`. That's correct. Ship it, refactor later.

---

# PHASE 5 — The real 3-tier ⭐ (the core of the grade)

**Goal:** split the single instance into isolated tiers behind load balancers.

Steps:
1. Split into a **web tier** (nginx + the React build) and an **app tier** (Express), in separate private subnets. → *tier separation.*
2. A **public ALB** in front of the web tier. → *ALB, target groups, listeners, health checks (using `/health` and `/` on the web tier).*
3. An **internal ALB** in front of the app tier. → *internet-facing vs internal load balancers.*
4. Configure **nginx** to serve the React build and reverse-proxy `/api/*` to the internal ALB. → *reverse proxy.*

⚠️ **The gotcha from the reference repo:** its nginx `proxy_pass` has a trailing slash that strips
the `/api` prefix. Our backend routes are all under `/api`, so **do not** add the trailing slash,
or every API call 404s. Decide it once, write it down.

✅ **Done when:** you hit the public ALB's DNS name → TeamOps loads → you create a project → it
persists in RDS. Full chain: **browser → ALB → nginx → internal ALB → Express → RDS**, with the
database never once exposed to the internet.

---

# PHASE 6 — Secrets Manager + IAM

**Goal:** no credentials anywhere in code or Terraform.

Steps:
1. Terraform creates a **Secrets Manager** secret holding `{ username, password, host, port, dbname }`.
2. The app tier's instances carry an **IAM instance profile** granting `secretsmanager:GetSecretValue`, scoped to **that one secret's ARN** (not `*`).
3. Update **`configs/databaseUrl.js`** (the seam from backend PR-28) to fetch the secret and assemble the URL at boot, instead of reading `DATABASE_URL` from the environment.

**Why this is cheap:** because of the seam, this is a change to *one file* in the backend plus the
IAM/secret resources in Terraform. Nothing else moves.

✅ **Done when:** `grep -ri password infrastructure/` finds no database password, and the app still
connects — it fetched the secret at boot.

---

# PHASE 7 — Autoscaling + high availability 🎯 (the 80% milestone)

**Goal:** the system survives failure on its own.

Steps:
1. **Launch templates** + **Auto Scaling Groups** for both the web and app tiers.
2. A **target-tracking scaling policy** on CPU. Load-test it and watch it scale out.
3. **Multi-AZ RDS** — a synchronous standby with automatic failover.

✅ **Done when:** you manually terminate an app instance → the ASG replaces it → the site never
goes down. **Record this** — it's the centerpiece of your demo.

### At the end of Phase 7 the graded architecture is complete. Everything after is polish.

---

# PHASE 8 — Packer (golden AMIs)

**Goal:** fast, repeatable instance launches.

You'll *feel* the problem first: every new instance spends ~5 minutes running `npm install` in
user_data before it can serve traffic — terrible for autoscaling.

Steps:
1. **Packer templates** baking node, nginx, and pm2 into custom AMIs (adapt from `3-tier/packer/`).
2. Terraform looks them up with a `data.aws_ami` block.

**Note:** the Piyush playlist has *no* Packer content — this is one to learn from the reference repo
and AWS docs.

✅ **Done when:** instance boot-to-healthy drops from ~5 minutes to ~60 seconds.

---

# PHASE 9 — DNS + HTTPS

**Goal:** a real domain with a padlock.

Steps:
1. Buy a domain (~₹1,000/yr — the one unavoidable expense).
2. **Route 53** hosted zone.
3. **ACM** certificate (DNS validation).
4. **HTTPS listener** on the public ALB (TLS terminates here); an A-record alias → the ALB.

✅ **Done when:** `https://teamops.<yourdomain>` loads with a valid certificate.

---

# PHASE 10 — Documentation + viva prep

- Architecture diagram (Mermaid → export to PNG).
- README: what it is, how to deploy it, what it costs.
- Cost report from the AWS billing console.
- **Demo video:** `terraform apply` → app live → kill an instance → self-heals → `terraform destroy`.
- **Rehearse the viva.** You will be asked:
  - Why private subnets?
  - Why an internal load balancer instead of calling the app servers directly?
  - What happens, step by step, when an EC2 instance dies?
  - Why Secrets Manager instead of environment variables?
  - Why is the NAT Gateway there, and why does it cost ~$32/month?
  - What does Terraform state actually store, and why is it in S3?

---

## Cost discipline (unchanged, non-negotiable)

- Full stack left running ≈ **$160/month** (NAT + 2 ALBs + Multi-AZ RDS + EC2, all billed hourly).
- **`terraform destroy` at the end of every session.** A 4-hour session costs ~$1–2.
- Billing alarms at $50 / $100 / $200. You have $300 credit — treat infrastructure as disposable.

---

## If you run short on time — cut in this order

1. **Phase 9** (HTTPS/domain) — demo on the raw ALB DNS name instead.
2. **Phase 8** (Packer) — user_data works, it's just slow.
3. Scaling *policies* — but **keep the ASG itself**, that's where the marks are.

**Never cut:** Phase 2 (manual AWS), the VPC, security groups, the two ALBs, private-subnet RDS,
or Secrets Manager. That is the graded core and the entire viva.

---

## The one-line summary

After the frontend, you stop being a web developer and become a cloud engineer. The app is done;
the **infrastructure is the project**, and it is roughly 80% of the grade. Start at Phase 2, build
AWS by hand once, and everything after it follows.
