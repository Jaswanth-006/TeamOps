# Phase 2 — Build AWS by Hand (Step by Step)

The most important phase in the project. You build the whole network **by clicking in the AWS
console**, feel every problem, then delete it all. No Terraform yet.

**Why do it by hand first?** Terraform is a tool for creating AWS resources. If you don't know what
the resources *are*, Terraform is just YAML that sometimes works. One afternoon here makes every
`.tf` file afterward readable — and it's where your viva answers come from.

**What you build (a deliberately small version):** one VPC, one public subnet, one private subnet,
an internet gateway, a NAT gateway, a bastion host, one private EC2, and one RDS database. That is
enough to feel every core concept. The full 12-subnet 3-tier comes later, in Terraform.

> Region for everything below: pick one and stay in it (e.g. **ap-south-1 / Mumbai**). Resources in
> different regions can't see each other, and a common beginner bug is creating things in two regions
> by accident. Check the region dropdown (top-right) before every step.

---

## Step 0 — Safety first (do this before anything else)

You have $300 of credit. These steps stop a mistake from eating it.

1. **Create an IAM admin user and stop using root.**
   - Console → **IAM** → Users → Create user → name `admin` → attach policy **AdministratorAccess**.
   - Create it, then create an **access key** (for later CLI use) and set a console password.
   - Log out of root, log back in as `admin`. Do everything from here as `admin`.
2. **Turn on a budget alert.**
   - Console → **Billing and Cost Management** → **Budgets** → Create budget → **Zero spend** or a
     monthly cost budget of **$20** → add your email. You'll get warned before it's a problem.
3. **Know the two things that cost money even when idle:** the **NAT Gateway** (~$0.045/hr ≈ $1/day)
   and **RDS** (~$0.02/hr for a small instance). Leaving them running overnight is a few dollars.
   Not catastrophic, but **you will delete everything at the end of this session** (Step 9).

✅ **Done when:** you're logged in as `admin` (not root) and a budget alert exists.

---

## Step 1 — Launch a plain EC2 and SSH in

*Goal: meet EC2, AMIs, key pairs, and security groups in the simplest possible setting.*

1. Console → **EC2** → **Launch instance**.
2. Name: `learn-web`. AMI: **Amazon Linux 2023**. Type: **t3.micro** (or t2.micro).
3. **Key pair:** Create a new one, name `teamops-key`, type **.pem**, download it. **Save it — you
   can't download it again.**
4. **Network settings** → for now, "Allow SSH from **My IP**" (not Anywhere).
5. Launch. Wait until **Instance state: running** and **Status checks: 2/2**.
6. Select it → **Connect** → **SSH client** tab → copy the `ssh -i ...` command.
   - On Windows, in a terminal where the `.pem` is: `ssh -i teamops-key.pem ec2-user@<public-ip>`
   - If it complains about key permissions, that's the `.pem` being too open — on Windows use
     `icacls` to restrict it, or use EC2 Instance Connect (the "Connect" button in the console).

**What you just learned:** an EC2 is a virtual server; the AMI is its starting disk image; the key
pair is how you prove who you are over SSH; the security group is the firewall that let port 22 in.

✅ **Done when:** you have a shell prompt on the instance (`[ec2-user@ip-... ~]$`).

---

## Step 2 — Feel a security group

*Goal: understand that a security group is a firewall, by opening a port.*

1. On the instance, install and start something on a port:
   `sudo dnf install -y nginx && sudo systemctl start nginx`
2. In a browser, go to `http://<public-ip>`. **It hangs** — the security group only allows port 22.
3. Console → EC2 → the instance → **Security** → click its security group → **Edit inbound rules**
   → Add rule: **HTTP, port 80, source My IP** → Save.
4. Refresh the browser. Now the nginx welcome page loads.

**What you just learned:** nothing reaches an instance unless a security group rule explicitly allows
that port from that source. This is the whole security model, in miniature.

✅ **Done when:** `http://<public-ip>` shows the nginx page after you add the rule (and hangs before).

> **Now terminate `learn-web`** (EC2 → Instance state → Terminate). It was just a warm-up. The real
> build starts with your own VPC.

---

## Step 3 — Build your own VPC + public subnet

*Goal: VPC, subnets, internet gateway, route tables — the core of networking.*

1. Console → **VPC** → **Create VPC** → choose **VPC only** (not the wizard — we want to feel each piece).
   - Name: `teamops-vpc`. IPv4 CIDR: `10.0.0.0/16`. Create.
2. **Create the public subnet:** VPC → Subnets → Create subnet → select `teamops-vpc`.
   - Name: `public-1`. Availability Zone: pick one (e.g. `ap-south-1a`). CIDR: `10.0.1.0/24`. Create.
3. **Create an Internet Gateway:** VPC → Internet gateways → Create → name `teamops-igw` → Create →
   then **Actions → Attach to VPC** → `teamops-vpc`.
4. **Make the subnet public with a route table:** VPC → Route tables → Create route table →
   name `public-rt`, VPC `teamops-vpc` → Create.
   - Open `public-rt` → **Routes** tab → Edit routes → Add route: Destination `0.0.0.0/0`,
     Target **Internet Gateway** → `teamops-igw` → Save.
   - **Subnet associations** tab → Edit → tick `public-1` → Save.
5. Also on `public-1`: Actions → **Edit subnet settings** → enable **Auto-assign public IPv4**.

**The one sentence that matters:** `public-1` is "public" *only* because its route table sends
`0.0.0.0/0` to the internet gateway. There is no "public" checkbox. That is the entire difference.

✅ **Done when:** you can explain why `public-1` is public. (Launch a test EC2 into it if you want to
confirm it gets a public IP and can reach the internet — then terminate it.)

---

## Step 4 — Add a private subnet + a bastion, and feel the wall

*Goal: private subnets and why you need a bastion (jump host).*

1. **Create the private subnet:** Subnets → Create subnet → `teamops-vpc` → name `private-1`,
   same AZ as `public-1`, CIDR `10.0.2.0/24`. Create. **Do not** give it a public-IP setting.
2. **Create a private route table:** Route tables → Create → `private-rt`, `teamops-vpc` → associate
   `private-1` with it. (Leave it with no `0.0.0.0/0` route for now — that's the point.)
3. **Launch the bastion** into the public subnet:
   - EC2 → Launch instance → name `bastion` → Amazon Linux 2023 → t3.micro → key `teamops-key`.
   - Network: **VPC `teamops-vpc`**, subnet **`public-1`**, auto-assign public IP **Enable**.
   - Security group: new, `bastion-sg`, allow **SSH (22) from My IP**.
4. **Launch a private instance** into the private subnet:
   - name `app` → same VPC → subnet **`private-1`** → auto-assign public IP **Disable**.
   - Security group: new, `app-sg`, allow **SSH (22) from the `bastion-sg` security group** (type the
     SG name/id as the source, *not* an IP). This is "SG referencing SG" — the key pattern.
5. **Try to SSH to `app` directly.** You can't — it has no public IP. **This is the wall.**
6. **SSH through the bastion instead:**
   - `ssh -i teamops-key.pem ec2-user@<bastion-public-ip>` → you're on the bastion.
   - From the bastion, `ssh ec2-user@<app-private-ip>` (the `10.0.2.x` address). You may need the key
     on the bastion, or set up SSH agent forwarding (`ssh -A`). You're now on the private box.

**What you just learned:** a private subnet has no route from the internet, so its instances have no
public IP and can't be reached directly. The **bastion** in the public subnet is the single, guarded
door in. And security groups can reference *other security groups*, so the rule keeps working no
matter how IPs change.

✅ **Done when:** you're on `app` (the private instance), reached *through* the bastion.

---

## Step 5 — Feel the missing NAT gateway

*Goal: understand NAT = outbound-only internet for private subnets.*

1. On the `app` instance (via the bastion), run: `sudo dnf install -y git`
2. **It hangs forever.** The private subnet has no route to the internet, so it can't reach the
   package servers — even for *outbound* traffic.
3. **Create a NAT gateway:** VPC → NAT gateways → Create → subnet **`public-1`** (NAT lives in a
   *public* subnet), Connectivity **Public**, **Allocate Elastic IP** → Create.
4. **Route private traffic through it:** Route tables → `private-rt` → Edit routes → Add route:
   Destination `0.0.0.0/0`, Target **NAT Gateway** → the one you made → Save.
5. Back on `app`, run `sudo dnf install -y git` again. **Now it works.**

**What you just learned:** private instances still need the internet for *outbound* things (installing
packages, OS updates) — but must not be reachable *from* the internet. A NAT gateway is exactly that:
outbound-only. It sits in a public subnet, and it's the ~$1/day resource to remember to delete.

✅ **Done when:** the install succeeds on `app` after adding the NAT route (and hung before).

---

## Step 6 — Put a database in the private subnets

*Goal: RDS, DB subnet groups, and reaching a private database from the bastion.*

1. You need **two** subnets in **different AZs** for RDS (it insists on multi-AZ capability). Create a
   second private subnet `private-2` in a *different* AZ (e.g. `ap-south-1b`), CIDR `10.0.3.0/24`,
   associated with `private-rt`.
2. **DB subnet group:** Console → **RDS** → Subnet groups → Create → name `teamops-db-subnets`, VPC
   `teamops-vpc`, add `private-1` and `private-2`.
3. **DB security group:** VPC → Security groups → Create → `db-sg` → inbound **PostgreSQL (5432) from
   `app-sg`** and also **5432 from `bastion-sg`** (so you can connect from the bastion for admin).
4. **Create the database:** RDS → Create database → **Standard create** → **PostgreSQL** →
   **Free tier** or a **db.t3.micro** → set a master username/password you'll remember →
   Connectivity: VPC `teamops-vpc`, subnet group `teamops-db-subnets`, **Public access: No**,
   security group `db-sg`. Create. (Takes several minutes to become **Available**.)
5. **Connect from the bastion:** install the client (`sudo dnf install -y postgresql15`) then
   `psql -h <rds-endpoint> -U <master-user> -d postgres` → enter the password → you're in.

**What you just learned:** RDS is a managed database; it lives in private subnets via a subnet group;
it has no public access; and the only things that can reach it on 5432 are the app tier and the
bastion, enforced by `db-sg`. The database is genuinely unreachable from the internet.

✅ **Done when:** you get a `postgres=>` prompt from the bastion, and you understand the database has
no public route.

---

## Step 7 — Draw it from memory

Close the console. On paper, draw: the VPC, the two route tables, which subnet the IGW and NAT attach
to, where the bastion/app/RDS sit, and the arrows for how a package install on `app` reaches the
internet. If you can do this, Phase 2 worked.

**Out loud, answer:**
- Why is `public-1` public and `private-1` private? *(route table target: IGW vs NAT/none.)*
- Why does `app` need the NAT gateway but the bastion doesn't?
- Why can't the internet reach the RDS instance?
- What does "security group referencing another security group" buy you?

These are viva questions. If you can answer them now, you've got them for the exam.

---

## Step 8 — (optional) Deploy the app onto this by hand

If you have time and want the payoff: on `app`, install Node, `git clone` your TeamOps repo, run the
backend against the RDS you just made (set `DATABASE_URL` to the RDS endpoint, run
`npx prisma migrate deploy && npm run seed`), and hit it from the bastion with
`curl localhost:5000/health`. This proves the whole private-tier path works before you automate it.

---

## Step 9 — DELETE EVERYTHING (do not skip)

Delete in this order (children before parents), or you'll get "dependency" errors — and you'll keep
paying for the NAT gateway and RDS:

1. **RDS** → Databases → your DB → Actions → **Delete** (uncheck "create final snapshot" for a
   throwaway learning DB). Wait until it's gone.
2. **NAT gateway** → Delete. Then **Elastic IPs** → **Release** the one it used (an unattached EIP
   costs a small amount).
3. **EC2** → terminate `bastion` and `app`.
4. **VPC** → you can now **Delete VPC** `teamops-vpc`, which cleans up subnets, route tables, the IGW
   attachment, and security groups in one action. (If it refuses, something above isn't deleted yet.)
5. **Confirm:** EC2 running instances = 0, NAT gateways = 0, RDS = 0, Elastic IPs = 0.

✅ **Done when:** the account is clean and the billing meter has stopped.

---

## What comes after this

Once you can draw the diagram from memory, you're ready for **Phase 3 — rebuild this exact thing in
Terraform** (see `docs/infrastructure-roadmap.md`). You'll notice you learn *zero* new AWS services
there — you already know what a subnet is. Phase 3 is purely about the tool.

---

## Prerequisite reminder (before you start Step 1)

Your machine was reinstalled, so first:
1. `winget install OpenJS.NodeJS.LTS` and reopen the terminal; confirm `node -v`.
2. `cd frontend && npm run build` — the deferred verification of the last 8 frontend PRs.
3. `winget install Docker.DockerDesktop` (needed later, not for Phase 2).
4. `aws configure` with the `admin` access key from Step 0, once you've created it.
