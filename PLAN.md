# TeamOps — Build Plan

3-tier AWS deployment of the Team Flow app. **The infrastructure is what is graded.**

Reference only, never edited: `3-tier/` (someone's AWS stack), `Team Flow/` (the React UI).

---

## First: what code are we actually writing?

| Part | Status | What you do |
|---|---|---|
| **`frontend/`** | Already exists (Team Flow) | **Copy it. Do NOT rewrite.** Edit ~8 files to replace dummy data with `fetch()` calls. |
| **`backend/`** | Does not exist | **You write it.** Express + Prisma. ~500 lines. The only app code you write. |
| **`infrastructure/`** | Does not exist | **You write it from scratch.** Terraform. ~800 lines. **This is the grade.** |
| **glue** (nginx.conf, boot scripts, Packer) | Exists in `3-tier/` | **Copy and adapt.** No marks here. Don't waste time. |

**You are not rewriting the React app.** You're cutting one wire (dummy data) and soldering in
another (the API). That's it.

---

## Rules

1. **`terraform destroy` after every session.** ~$1–2/session. Left running: ~$160/month.
2. **Write the graded core yourself** (VPC, SGs, ALBs, ASG, RDS, IAM). **Copy the boilerplate**
   (nginx, shell scripts). You must be able to defend every Terraform line in a viva.
3. **Don't pre-learn.** Each phase teaches the services it needs, when it needs them.
4. **Never skip a phase's "done when".** It's the proof you actually finished.

---

# PHASE 0 — Foundation

**Build:** the `TeamOps` repo (`frontend/ backend/ infrastructure/ packer/ docs/`).
AWS account → IAM admin user + MFA (never use root) → billing alerts.
Install: AWS CLI, Terraform, Packer, Docker, Node 22. Create an EC2 key pair.

**Know before starting:** basic git (`add`, `commit`, `push`). That's all.

**You'll learn:** AWS console navigation, IAM users vs root, `aws configure`.

**Write no code.**

✅ **Done when:** `aws sts get-caller-identity` returns your IAM user, and
`terraform -v` / `docker -v` both work.

---

# PHASE 1 — The app runs on your laptop

*No AWS. None. The goal is a **known-good app** so that later, when something breaks on AWS,
you know for a fact it's the infrastructure and not your code.*

**Build:**
- Postgres in a Docker container
- `backend/` — Express + Prisma API **(you write this)**
- Seed script: turn `dummyWorkspaces` from `assets.js` into real database rows
- `frontend/` — copy Team Flow in, then edit the pages to `fetch()` from the API instead of
  reading Redux dummy state
- `docker-compose.yml` to run all three together

**Know before starting:** JavaScript, Node, React (you already have this). Basic SQL — just the
idea of tables and rows.

**You'll learn:** Docker basics, Prisma (schema → migrate → seed → query), REST API design.

**Code you write:** all of `backend/`. Small edits to ~8 frontend files.

✅ **Done when:** `docker compose up` → create a project in the browser → **refresh the page** →
it's still there. That's the moment it stops being a mockup.

> Postgres + Express + React as three processes on one laptop **is** the three-tier architecture.
> AWS just moves those three boxes onto separate machines. Understand it here, where debugging is easy.

---

# PHASE 2 — Build AWS by hand ⭐ *the phase everyone wants to skip*

*No Terraform. No code. You click, you break things, you delete it all.*

Do these **in order** — each step exists to make you feel the pain that the next one solves:

| Build | What it teaches you |
|---|---|
| Launch a `t3.micro`, SSH into it | EC2, AMIs, key pairs, security groups |
| Build your **own** VPC: CIDR → subnet → Internet Gateway → route table → EC2 in it | VPC, CIDR, subnets, IGW, route tables |
| Put an EC2 in a **private** subnet. Try to SSH. *You can't.* Add a bastion | private subnets, bastion hosts, SGs referencing other SGs |
| On that private box, run `npm install`. *It hangs forever.* Add a **NAT Gateway** | NAT = outbound-only internet |
| RDS Postgres in private subnets → connect with `psql` **from the bastion** | RDS, DB subnet groups |
| **Delete all of it, by hand.** Forty clicks. | why Terraform exists |

**Know before starting:** *nothing.* This phase IS the learning. Don't watch a course first.

**You'll learn:** every AWS service in the project — EC2, VPC, subnets, IGW, NAT, route tables,
security groups, bastion, RDS.

**Write no code.**

> **The one sentence that makes VPC click:** a subnet is "public" *only* because its route table
> sends `0.0.0.0/0` to an Internet Gateway. There is no checkbox. That's the entire difference.

✅ **Done when:** you can draw the VPC on paper from memory, and explain out loud why the private
instance needed a NAT Gateway but the public one didn't.

---

# PHASE 3 — Terraform: rebuild Phase 2 as code

*Zero new AWS services. You already know what a subnet is. This phase is purely about the tool.*

**Build:**
1. One S3 bucket. Nothing else. `init` → `plan` → `apply` → `destroy`
2. The VPC, all values hardcoded
3. Pull values out into `variables.tf` + `dev.tfvars`
4. 3 subnets across 3 AZs *without copy-paste*
5. Security groups

**Know before starting:** Phase 2. You must know what these resources *are* — otherwise
Terraform is just magic that sometimes works.

**You'll learn:** HCL syntax, providers, resources, **the state file**, variables, outputs,
`count`/`for_each`, `data` sources.

**Code you write:** `infrastructure/` begins here.

✅ **Done when:** `terraform apply` builds your VPC from nothing, `terraform destroy` removes it,
and you can do it repeatably.

---

# PHASE 4 — Get the app onto AWS (one server)

**Build:**
- EC2 + RDS in Terraform
- `user_data` script that installs and starts your backend automatically on boot
- Terraform state moved to an S3 backend
- Refactor into modules: `modules/vpc`, `modules/sg`, `modules/ec2`, `modules/rds`

**Know before starting:** Phase 3. Basic bash.

**You'll learn:** `user_data` / cloud-init, `templatefile()`, remote state + locking,
Terraform modules.

**Code you write:** more Terraform. A boot script (adapt from `3-tier/`).

✅ **Done when:** `terraform apply` from nothing → Team Flow loads on an EC2 public IP →
`terraform destroy` → gone.

> Your Terraform will be uglier than the reference repo's. Correct. Ship it, refactor later.

---

# PHASE 5 — Make it an actual 3-tier ⭐ *the core of the grade*

**Build:**
- Split the one server into a **web tier** (nginx + React build) and an **app tier** (Express),
  in separate private subnets
- **Public ALB** → web tier
- **Internal ALB** → app tier
- nginx serves the React build and reverse-proxies `/api/*` to the internal ALB

**Know before starting:** Phase 4. What a reverse proxy is (nginx sits in front and forwards
some requests elsewhere — that's the whole concept).

**You'll learn:** ALBs, target groups, listeners, health checks, internet-facing vs internal
load balancers, nginx `proxy_pass`.

**Code you write:** Terraform. `nginx.conf` (adapt from `3-tier/`).

⚠️ The reference repo's `proxy_pass` has a **trailing slash**, which strips the `/api` prefix
before forwarding. Decide your convention and make both ends agree, or lose half a day to
mystery 404s.

✅ **Done when:** you hit the public ALB's DNS name → Team Flow loads → you create a project →
it persists in RDS. The full chain is live:
**browser → ALB → nginx → internal ALB → Express → RDS**, and the database has never been
exposed to the internet.

---

# PHASE 6 — Secrets and IAM

**Build:** AWS Secrets Manager holds the DB credentials. The app tier's instances carry an IAM
instance profile that lets them read *that one secret*. The backend fetches its password at boot
instead of having one hardcoded.

**Know before starting:** Phase 5.

**You'll learn:** IAM roles vs users, instance profiles, least privilege, Secrets Manager.

**Code you write:** Terraform. One small backend change (a `DbConfig.js` — the reference repo has
a good one to adapt).

✅ **Done when:** `grep -ri password infrastructure/ backend/` finds no database password.

---

# PHASE 7 — Make it survive failure 🎯 *the architecture is complete here*

**Build:** Launch Templates + Auto Scaling Groups for both tiers. A CPU target-tracking scaling
policy. Multi-AZ RDS.

**Know before starting:** Phases 5–6.

**You'll learn:** ASGs, launch templates, desired/min/max, ASG vs ALB health checks,
instance refresh, target tracking.

✅ **Done when:** you terminate an instance by hand → the ASG replaces it → **the site never goes
down.** Record this. It's your demo.

### 🎯 At the end of Phase 7 you have the complete graded architecture. Everything after this is polish.

---

# PHASE 8 — Packer (golden AMIs)

*You'll have **felt** this problem by now: every new instance spends 5 minutes running
`npm install` before it can serve traffic. That's terrible for autoscaling.*

**Build:** a pre-baked AMI with node, nginx, and pm2 already installed. Terraform looks it up
with a `data.aws_ami` block.

**Know before starting:** Phase 7 — you need to have *suffered* the slow boots first, or Packer
feels pointless.

**You'll learn:** AMI vs user_data, provisioners, `packer build`.

**Code you write:** Packer templates (adapt from `3-tier/packer/`).

✅ **Done when:** boot-to-healthy drops from ~5 minutes to ~60 seconds.

---

# PHASE 9 — Domain and HTTPS

**Build:** buy a domain → Route 53 hosted zone → ACM certificate (DNS validation) →
HTTPS listener on the ALB → A-record alias pointing at the ALB.

**Know before starting:** Phase 5 (you need a working ALB).

**You'll learn:** DNS, hosted zones, alias records, ACM validation, TLS termination at the ALB.

✅ **Done when:** `https://teamops.<yourdomain>` loads with a padlock.

---

# PHASE 10 — Defend it

**Build:** architecture diagram, README, cost report, demo video
(`apply` → live → kill an instance → self-heals → `destroy`).

**Rehearse the viva.** You *will* be asked:
- Why private subnets?
- Why an internal load balancer instead of calling the app servers directly?
- What happens when an instance dies?
- Why Secrets Manager instead of environment variables?
- Why is the NAT Gateway there, and why does it cost $32/month?
- What does Terraform state actually store, and why is it in S3?

✅ **Done when:** you can answer all six without notes.

---

## If you run out of time, cut in this order

1. **Phase 9** (HTTPS) — demo on the raw ALB DNS name instead
2. **Phase 8** (Packer) — `user_data` works, it's just slow
3. Scaling *policies* — but **keep the ASG itself**, that's where the marks are

**Never cut:** Phase 2 (manual AWS), the VPC, security groups, the two ALBs, private-subnet RDS,
or Secrets Manager. That's the graded core and the entire viva.
