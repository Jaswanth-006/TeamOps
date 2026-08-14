# DevOps Concepts Guide — From Scaffold to Route 53

A plain-English walkthrough of **every concept** in the TeamOps infrastructure, in the order we
build it (the 25 PRs). Written for a developer stepping into DevOps for the first time. For each
concept: **what it is, why we use it, how we use it, the benefit, and the steps.** No code — the code
lives in `infrastructure/`; this explains the *ideas* behind it.

> Companion docs: `docs/3-tier-explained.md` (the big picture) and
> `docs/infrastructure-implementation.md` (the PR checklist).

---

## First, the two tools underneath everything

### Terraform (Infrastructure as Code)
- **What:** a tool where you *describe* the cloud resources you want in text files, and it creates
  them for you.
- **Why:** clicking around the AWS console works once, but you can't repeat it reliably, review it,
  or undo it cleanly. With Terraform, your entire infrastructure is code you can read, version in
  git, recreate from scratch, and destroy with one command.
- **How:** you write `.tf` files describing resources; `terraform plan` previews the changes;
  `terraform apply` makes them real; `terraform destroy` removes everything.
- **Benefit:** repeatable, reviewable, disposable infrastructure. Build the whole stack in 12
  minutes; tear it down in 5 so it stops costing money.

### AWS (the cloud provider)
- **What:** Amazon's cloud — rented servers, networks, databases, and dozens of managed services.
- **Why:** you don't own data centers; you rent exactly what you need and give it back.
- **How:** Terraform talks to AWS through the "AWS provider" using your account credentials.

---

# GROUP I0 — Foundations (PRs 1–3)

### PR-1 · Scaffold + provider + versions
- **What:** the starting files that tell Terraform which version to use and which cloud (AWS) and
  region to target.
- **Why:** pinning versions means the project behaves the same on every machine and next year, not
  just today. A `.gitignore` keeps dangerous files (state, secrets) out of git.
- **How:** a `versions.tf` (version pins), a `providers.tf` (AWS + region), a `.gitignore`.
- **Benefit:** reproducibility and safety from day one.
- **Steps:** write the version block → configure the provider → ignore state/secret files.

### PR-2 · Variables + dev.tfvars
- **What:** named inputs (like function parameters) for things that change between environments —
  region, network sizes, instance types, capacities.
- **Why:** you write the infrastructure once and reuse it for dev, staging, and prod just by feeding
  different values. No copy-pasting.
- **How:** declare each input in `variables.tf`; supply dev values in `dev.tfvars`.
- **Benefit:** one codebase, many environments; nothing hardcoded.
- **Steps:** declare variables → mark secrets `sensitive` → put non-secret values in a tfvars file.

### PR-3 · S3 remote state
- **What:** Terraform keeps a "state file" — its memory of everything it has built. This stores that
  file in an S3 bucket instead of on your laptop.
- **Why:** the state file is critical. On your laptop it can be lost, and it can't be shared with
  teammates. In S3 it's durable, shared, and can be *locked* so two people don't apply at once and
  corrupt it.
- **How:** a backend block pointing at an S3 bucket (created once beforehand).
- **Benefit:** safe, shareable, lockable state — the difference between a hobby and a real project.
- **Steps:** create the bucket once → configure the backend → `terraform init`.

---

# GROUP I1 — Networking (PRs 4–8)

### PR-4 · VPC (Virtual Private Cloud)
- **What:** your own private, isolated network inside AWS — a walled compound with its own internal
  IP addresses.
- **Why:** you don't want your servers on the open internet or mixed with strangers'. A VPC is your
  private space where you control every door and route.
- **How:** define a VPC with an address range (e.g. `10.75.0.0/16` — room for 65,000 addresses).
- **Benefit:** total control over your network's layout and security.
- **Steps:** pick a CIDR range → create the VPC → enable DNS so names resolve inside it.

### PR-5 · Subnets across Availability Zones
- **What:** subdivisions of the VPC — "rooms" in the compound. We make 12: three each for public,
  web, app, and database, spread across three **Availability Zones** (separate data centers).
- **Why:** two reasons. (1) Some rooms should face the street (public), most shouldn't (private).
  (2) Spreading across separate data centers means one data center catching fire doesn't take you
  down.
- **How:** create subnets from CIDR sub-ranges, each pinned to a different AZ.
- **Benefit:** the structure that makes both isolation and high availability possible.
- **Steps:** carve the VPC range into subnet ranges → assign each to an AZ → tag by tier.

### PR-6 · Internet Gateway + public routing
- **What:** the Internet Gateway is the compound's street door. A "route table" is a signpost telling
  traffic where to go.
- **Why:** without a gateway and a route pointing to it, a subnet has no way to reach the internet.
- **How:** attach an internet gateway to the VPC; give the public subnets a route table that sends
  "anywhere" traffic (`0.0.0.0/0`) to that gateway.
- **The key insight:** a subnet is "public" **only** because its route table points to the internet
  gateway. There's no "public" switch — it's entirely about the route.
- **Steps:** create the gateway → make a route table with the internet route → attach it to the
  public subnets.

### PR-7 · NAT Gateway + private routing
- **What:** a NAT Gateway is a one-way mail slot for private subnets — outbound only.
- **Why:** private servers still need the internet to *download* things (software, updates), but must
  never be reachable *from* the internet. NAT gives them exactly that: they can start a conversation
  outward, but nobody can start one inward. The database subnets get **no** internet route at all —
  the strongest isolation.
- **How:** put a NAT gateway in a public subnet; point the web/app private route tables at it; leave
  the db route table with no internet route.
- **Benefit:** private servers stay patched and functional without being exposed. The database is
  sealed off entirely.
- **Steps:** allocate an Elastic IP → create the NAT in a public subnet → route web/app private
  subnets through it → leave db subnets with no internet route.

### PR-8 · Compose the VPC
- **What:** connect the VPC "module" (a reusable package of the above) into the main configuration.
- **Why:** modules keep things organized and reusable, like functions in code.
- **Benefit:** the networking layer is now a clean, self-contained building block.

---

# GROUP I2 — Security Groups (PRs 9–12)

### The concept: Security Groups
- **What:** a firewall attached to a resource, with a guest list of who may connect and on which
  port.
- **Why:** even inside your private network, you don't want everything talking to everything. Each
  tier should accept traffic **only** from the tier directly in front of it.
- **The powerful idea:** security groups can reference *other security groups* instead of IP
  addresses. So the rule is "allow the web tier," not "allow 10.75.4.7." As servers come and go and
  change IPs, the rule keeps working automatically.
- **Benefit:** least privilege — each door opens only for exactly who should pass, and it never
  needs updating as the network changes.

The chain we build (PRs 9–11):
```
Internet → [public ALB] → [web tier] → [internal ALB] → [app tier] → [database]
```
- **PR-9:** bastion (SSH from your IP), public ALB (80/443 from the internet).
- **PR-10:** web tier (traffic only from the public ALB), internal ALB (traffic only from the web
  tier).
- **PR-11:** app tier (traffic only from the internal ALB, on port 4000), database (port 5432 only
  from the app tier and the bastion).
- **PR-12:** wire the security module into the root.

---

# GROUP I3 — Data Tier (PRs 13–15)

### PR-13 · RDS PostgreSQL
- **What:** a managed PostgreSQL database. "Managed" means AWS runs it — backups, patching, failover
  — you just use it.
- **Why:** running your own database server means babysitting backups, updates, and recovery. RDS
  does all that. **Multi-AZ** keeps a synchronized standby copy in another data center that takes
  over automatically if the primary fails.
- **How:** define a database instance, place it in the isolated db subnets, mark it *not publicly
  accessible*.
- **Benefit:** a reliable, self-healing, backed-up database with almost no operational work.
- **Steps:** create a subnet group (which private subnets it lives in) → define the instance →
  disable public access → attach the database security group.

### PR-14 · Secrets Manager
- **What:** a secure vault for sensitive values — here, the database password.
- **Why:** passwords must never live in code or config files in git. Secrets Manager stores them
  encrypted, and apps fetch them at runtime.
- **How:** store `{username, password, host, port, dbname}` as a secret; the app reads it on startup.
- **Benefit:** no credentials in source control, ever. Rotate the password in one place.
- **Steps:** create the secret → put the DB connection details in it → grant the app permission to
  read it (see IAM, PR-19).

### PR-15 · Compose the data tier
- Wire RDS and Secrets Manager into the root, in the right order (database first, then the secret
  that describes it).

---

# GROUP I4 — Load Balancers (PRs 16–18)

### The concept: Application Load Balancer (ALB)
- **What:** a receptionist that spreads incoming requests across several identical servers and stops
  routing to any server that fails a health check.
- **Why:** one server can't handle everything and is a single point of failure. A load balancer
  gives you many servers behind one address, with automatic removal of broken ones.

- **PR-16 · Public ALB → web tier:** internet-facing, in the public subnets, health-checks the web
  servers on `/`. This is the site's front door.
- **PR-17 · Internal ALB → app tier:** *internal* (no public address), health-checks the app servers
  on `/health`. Only the web tier can reach it. This is what keeps the app tier private while still
  reachable.
- **PR-18 · Compose:** wire the ALB module and expose the public ALB's address.
- **Benefit:** scalability and resilience; and the internal ALB is precisely what lets the app tier
  stay hidden from the internet.

---

# GROUP I5 — Compute & Auto Scaling (PRs 19–23)

### PR-19 · IAM role + instance profile
- **What:** IAM is AWS's permission system. A **role** is a set of permissions a server can assume; an
  **instance profile** attaches a role to EC2 servers.
- **Why:** the app servers need to read the database password from Secrets Manager — but you don't
  put AWS keys on a server. Instead the server *is* granted permission via a role.
- **The right way:** scope the permission to *that one secret*, not "all secrets" (least privilege).
- **Benefit:** servers get exactly the permissions they need, with no long-lived keys lying around.

### PR-20 · Launch templates + user data
- **What:** a launch template is a blueprint for a server — which image, size, network, and a startup
  script ("user data") that runs on first boot.
- **Why:** for auto scaling to create identical servers on demand, it needs a blueprint. The startup
  script installs the app, pulls the code, and starts it.
- **Benefit:** every new server is born identical and ready, automatically.
- **Steps:** define a template per tier → include a boot script that sets the server up → reference
  the machine image.

### PR-21 · Auto Scaling Groups (ASG)
- **What:** a manager that keeps a target number of identical servers running, across multiple AZs,
  and replaces any that die.
- **Why:** this is what makes the system self-healing. Set "I want 2 servers"; if one dies, the ASG
  builds a new one. No human needed.
- **Benefit:** resilience (auto-replacement) and the foundation for scaling.
- **Steps:** point the ASG at the launch template → spread it across the private subnets → attach it
  to the load balancer's target group → set desired/min/max counts.

### PR-22 · Scaling policies
- **What:** rules that add or remove servers based on load (e.g. "keep average CPU near 50%").
- **Why:** traffic isn't constant. Under load, add servers; when it's quiet, remove them to save
  money. Automatically.
- **Benefit:** handles spikes without over-paying during quiet times.

### PR-23 · Compose compute
- Wire the compute module together (IAM, templates, ASGs, scaling).

---

# GROUP I6 — DNS & HTTPS (PRs 24–25)

### PR-24 · Route 53 + ACM + HTTPS
- **Route 53 (DNS):** translates your domain name (`teamops.example.com`) into the load balancer's
  address, so users type a name, not an IP.
- **ACM (Certificate Manager):** issues the free SSL/TLS certificate that enables **HTTPS** (the
  padlock). Encryption is terminated at the load balancer.
- **Why:** users expect a real domain and a secure (https) connection; browsers warn on anything
  else.
- **Benefit:** a professional, secure, named endpoint.
- **Steps:** create a DNS record pointing the domain at the ALB → attach the certificate to the ALB's
  HTTPS listener.

### PR-25 · Final outputs + README
- **What:** print the useful values after building (the site URL, database endpoint, etc.) and
  document how to run the whole thing.
- **Why:** so anyone (including future-you) can deploy and understand it.
- **Benefit:** the project is complete, usable, and documented.

---

## The big picture in one paragraph

You describe a **private network** (VPC) carved into **rooms** (subnets), some facing the street
(public) and most not (private). A **gateway** and **NAT** control who reaches the internet.
**Firewalls** (security groups) let each tier talk only to its neighbor. A **managed database** sits
in the most isolated rooms. **Load balancers** spread traffic across **auto-scaling** fleets of
identical servers that heal themselves. **Secrets** are vaulted and handed out via **IAM**
permissions. **DNS and a certificate** give it a real, secure address. And all of it is **code** —
built, changed, and destroyed with a command. That's DevOps.
