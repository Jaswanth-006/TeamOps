# Infrastructure Deep Dive — Every Concept, From Scratch

A self-contained study guide to **everything used to build the TeamOps 3-tier architecture** (PRs
2–25). Written for someone meeting these ideas for the first time, with no video required. Each
section explains a concept from first principles: *what it is, the problem it solves, how it
actually works, an analogy, how we use it, and the confusions to avoid.*

> Read `docs/3-tier-explained.md` first for the big picture ("why 3 tiers"). This document is the
> detailed companion — the *what* and *how* of every building block.

**Learning order** (not quite PR order — some ideas must come first):

1. Terraform & Infrastructure as Code
2. IP addresses & CIDR *(the foundation for everything network)*
3. Region & Availability Zones
4. VPC
5. Subnets
6. Route tables *(the key to public vs private)*
7. Internet Gateway
8. NAT Gateway & Elastic IP
9. Security Groups
10. EC2, AMIs, Key Pairs
11. RDS (managed database)
12. Secrets Manager
13. IAM (roles, policies, instance profiles)
14. Load Balancers (ALB, target groups, listeners, health checks)
15. Launch Templates & User Data
16. Auto Scaling Groups
17. Scaling Policies & CloudWatch
18. Route 53 (DNS)
19. ACM & HTTPS
20. Terraform State & Modules

---

## 1. Terraform & Infrastructure as Code

**What it is.** Terraform is a tool where you *write down* the cloud resources you want in text
files, and it creates them for you by talking to AWS.

**The problem it solves.** You *could* build everything by clicking in the AWS website. But: you
can't repeat it reliably, you can't review it, you can't share it, and you can't cleanly undo it.
Six months later nobody remembers the 200 clicks. "Infrastructure as Code" means your whole cloud
setup is text you can read, store in git, rebuild from nothing, and delete with one command.

**How it works.** You write `.tf` files describing *desired state* ("I want a VPC with this address
range"). Terraform compares that to what currently exists and works out the difference:
- `terraform plan` → shows what it *would* change (a dry run).
- `terraform apply` → makes it real.
- `terraform destroy` → removes everything it made.

You describe the *end result*, not the steps. Terraform figures out the order (it knows a subnet
needs its VPC to exist first).

**Analogy.** A recipe vs. cooking from memory. The recipe (code) can be followed by anyone, improved,
and repeated exactly. Cooking from memory (clicking) works once and lives in your head.

**How we use it.** The entire `infrastructure/` folder is Terraform. One `apply` builds the whole
3-tier stack; one `destroy` removes it (which is also how we avoid paying for it overnight).

**Confusion to avoid.** Terraform doesn't "run" your servers or watch them. It *creates* resources
and records what it made. After that, AWS runs them. Terraform's job is provisioning, not operating.

---

## 2. IP Addresses & CIDR — the foundation

You cannot understand VPCs or subnets without this. It's 10 minutes that makes everything else click.

**What an IP address is.** Every machine on a network has an address, like `10.75.4.20`. Four numbers
(0–255), so it's really 32 bits. It's a phone number for computers.

**What CIDR is.** CIDR notation describes a *range* of addresses with a slash number, like
`10.75.0.0/16`. The `/16` means "the first 16 bits are fixed; the rest can be anything."

- `10.75.0.0/16` → the first two numbers (`10.75`) are locked. The last two vary freely
  (`10.75.0.0` through `10.75.255.255`). That's **65,536 addresses** — a big network.
- `10.75.4.0/24` → the first three numbers (`10.75.4`) are locked. Only the last varies
  (`10.75.4.0`–`10.75.4.255`). That's **256 addresses** — a small slice.

**The rule of thumb:** *bigger slash number = smaller network.* `/16` is huge, `/24` is small, `/32`
is exactly one address.

**How we use it.** Our whole VPC is `10.75.0.0/16` (65k addresses). We carve it into twelve `/24`
subnets (256 each): `10.75.1.0/24`, `10.75.2.0/24`, and so on. Each subnet is a non-overlapping
slice of the big range.

**Why `10.75.x.x`?** Addresses starting with `10.` are "private" — reserved for internal networks,
never used on the public internet. Perfect for a private cloud.

**Confusion to avoid.** `0.0.0.0/0` means "every possible address" — i.e. "the entire internet /
anywhere." You'll see it constantly in routing and firewall rules. It's not a real machine; it's a
wildcard meaning "anywhere."

---

## 3. Region & Availability Zones

**What a Region is.** A geographic location where AWS has data centers — e.g. `ap-south-1` (Mumbai),
`us-east-1` (Virginia). You pick one to deploy into. Resources in different regions can't easily talk
and are billed separately.

**What an Availability Zone (AZ) is.** Inside one region, there are several *physically separate* data
centers, called Availability Zones (e.g. `ap-south-1a`, `ap-south-1b`, `ap-south-1c`). They're close
enough for fast connections but far enough that a fire, flood, or power cut in one doesn't affect the
others.

**The problem AZs solve.** If everything you own is in one building and that building loses power,
you're down. If you spread copies across three buildings, one failure is survivable.

**How we use it.** We put a subnet of each tier in *each* of three AZs. So the web tier, app tier, and
database all have presence in three separate data centers. A whole AZ can fail and the app stays up.
This is what "highly available" means.

**Analogy.** Don't keep all your money in one bank branch. Spread it across three; a robbery at one
doesn't ruin you.

---

## 4. VPC (Virtual Private Cloud)

**What it is.** Your own private, isolated network inside AWS. A walled compound with its own internal
address system that you fully control.

**The problem it solves.** You don't want your servers sitting on the open internet, or mixed in with
other AWS customers' machines. A VPC gives you a private space where *you* decide every address, every
door, and every rule.

**How it works.** You create a VPC with a CIDR range (ours: `10.75.0.0/16`). Everything you build —
servers, databases, load balancers — lives inside it and gets an address from that range. By default,
nothing inside can reach the internet and the internet can't reach in; *you* open exactly the doors
you want.

**Analogy.** A gated compound. Inside, you build rooms and hallways and decide who can go where. The
outside world sees only the front gate you choose to install.

**How we use it.** One VPC holds the entire TeamOps system. `enable_dns_hostnames` is turned on so
machines inside can find each other by name (the database gets a friendly hostname instead of a bare
IP).

**Confusion to avoid.** A VPC is *networking*, not servers. It's the empty compound. The servers
(EC2), database (RDS), etc. are things you place *inside* it.

---

## 5. Subnets

**What it is.** A subdivision of the VPC's address range — a "room" in the compound. Each subnet is a
smaller CIDR slice (ours are `/24`, 256 addresses each) and lives in exactly one Availability Zone.

**The problem it solves.** You don't want everything in one undifferentiated space. Some things should
face the internet (a load balancer); most shouldn't (your database). Subnets let you group resources
and apply different rules to each group. And pinning each subnet to an AZ is how you spread across data
centers.

**How we use it — 12 subnets in 4 groups:**

| Group | Purpose | Faces internet? |
|-------|---------|-----------------|
| **Public** (×3) | Load balancer, bastion, NAT gateway | Yes |
| **Web private** (×3) | nginx + React servers | No (outbound only) |
| **App private** (×3) | Express API servers | No (outbound only) |
| **DB private** (×3) | PostgreSQL database | No — not at all |

Three of each so every tier exists in all three AZs.

**The crucial point (read carefully).** A subnet is **not** "public" or "private" because of a
setting on the subnet itself. It's public or private entirely because of its **route table** (next
section). This trips up almost everyone. There is no "make public" checkbox that matters — it's all
about routing.

---

## 6. Route Tables — the key to public vs private

**What it is.** A set of signposts telling network traffic where to go based on its destination.
Every subnet is associated with exactly one route table.

**How it works.** A route table is a list of rules like "traffic for *this* destination goes to *that*
door." Every route table automatically has one built-in rule: "traffic for addresses *inside the VPC*
stays local" (so all your subnets can always talk to each other). You add rules for everything else.

The rule that matters most: **where does `0.0.0.0/0` (the whole internet) go?**

- If a subnet's route table says "`0.0.0.0/0` → **Internet Gateway**," that subnet is **public** —
  its machines can be reached from and reach the internet.
- If it says "`0.0.0.0/0` → **NAT Gateway**," the subnet is **private but outbound-capable** — its
  machines can start conversations out to the internet, but nobody outside can start one in.
- If it has **no `0.0.0.0/0` rule at all**, the subnet is **fully isolated** — it can only talk to
  things inside the VPC. This is our database tier.

**This single idea is the whole public/private distinction.** Same kind of subnet, same kind of
server — the *only* difference is which door its route table sends internet traffic to.

**How we use it.** Public subnets → route to the Internet Gateway. Web and app subnets → route to the
NAT Gateway. DB subnets → no internet route. Four route tables, one per behavior.

**Analogy.** Route tables are the signs at every hallway junction. A public room's sign points to the
front gate. A private room's sign for "outside mail" points to the one-way mail slot. The vault's
hallway has no "outside" sign at all.

---

## 7. Internet Gateway (IGW)

**What it is.** The VPC's single connection to the public internet — the compound's front gate.

**The problem it solves.** A VPC is sealed by default. Without a gateway, nothing inside can ever
reach the internet, and vice versa. The IGW is the physical door; the route table is the sign that
uses it.

**How it works.** You create one IGW and attach it to the VPC. Then, in the *public* subnets' route
table, you add "`0.0.0.0/0` → this IGW." Now machines in those subnets with a public IP can send and
receive internet traffic. Two things are needed for a machine to be internet-reachable: a route to the
IGW *and* a public IP address.

**How we use it.** One IGW for the VPC. Only the public subnets' route table points to it. That's what
lets the public load balancer and bastion be reachable.

**Confusion to avoid.** Attaching an IGW to the VPC doesn't make everything public. Nothing changes
until a *route table* points `0.0.0.0/0` at it. The gateway is the door; the route is the decision to
use it.

---

## 8. NAT Gateway & Elastic IP

**What it is.** A NAT (Network Address Translation) Gateway lets private servers reach the internet
**outbound only** — they can start a conversation out, but nothing outside can start one in.

**The problem it solves.** Your private servers (web, app) still need the internet: to download
software, OS security updates, npm packages. But you must *never* let the internet reach in and attack
them. NAT is exactly this asymmetry: outbound yes, inbound no.

**How it works.** The NAT gateway sits in a *public* subnet (it needs internet access itself). Private
subnets' route tables send `0.0.0.0/0` to the NAT. When a private server makes a request, the NAT
forwards it out under its own public address and passes the reply back. Because the connection was
*started from inside*, replies are allowed — but an outsider can't initiate anything, because they
have no route in.

**Elastic IP.** The NAT needs a fixed public IP address that doesn't change. An "Elastic IP" is a
static public address you reserve and attach to it.

**How we use it.** One NAT gateway (with one Elastic IP) in a public subnet. The web and app private
subnets route their outbound internet through it. The database subnets don't use it at all — they
never need the internet.

**The cost note (worth knowing for the viva).** A NAT gateway costs about **$1/day** even when idle —
one of the two things (with load balancers) that bill hourly. Production setups run one NAT per AZ for
resilience, which triples the cost; we use one to save money and note the trade-off.

**Analogy.** A one-way mail slot in the compound wall. People inside can post letters out and get
replies to those letters. Nobody outside can shove mail *in* uninvited.

---

## 9. Security Groups

**What it is.** A firewall attached to a resource (a server, a load balancer, a database). It has a
guest list: which traffic may come *in* (ingress) and, optionally, go *out* (egress), on which ports,
from which sources.

**The problem it solves.** Even inside your private network, you don't want everything talking to
everything. If an attacker somehow lands on a web server, they still shouldn't be able to reach the
database directly. Each tier should accept connections *only* from the tier directly in front of it.

**How it works.** A security group is a list of allow-rules (there's no "deny" — anything not
explicitly allowed is blocked). A rule says "allow TCP port 5432 from *source*." The source can be an
IP range **or — and this is the powerful part — another security group.**

**The killer feature: referencing other security groups.** Instead of "allow port 4000 from
`10.75.7.13`," you write "allow port 4000 from the internal-ALB security group." Now *any* machine in
that group is allowed, no matter its IP. As auto scaling creates and destroys servers with new IPs
every few minutes, the rule keeps working with zero maintenance. You're describing *roles*, not
addresses.

**Ports you'll see:** 22 (SSH), 80 (HTTP), 443 (HTTPS), 4000 (our Express API), 5432 (PostgreSQL).

**How we use it — the chain:**
```
Internet → [public ALB SG] → [web SG] → [internal ALB SG] → [app SG] → [db SG]
```
- Public ALB: allows 80/443 from anywhere.
- Web: allows 80 *only from the public ALB's group*; SSH only from the bastion.
- Internal ALB: allows 80 *only from the web group*.
- App: allows 4000 *only from the internal ALB group*; SSH only from the bastion.
- Database: allows 5432 *only from the app group* (and the bastion, for admin).

Each door opens only for the one in front of it. That's "least privilege."

**Stateful — a nice detail.** Security groups are *stateful*: if you allow a request in, the reply is
automatically allowed back out. You don't write return rules. (This is different from older "network
ACLs," which you can ignore for this project.)

**Analogy.** A guard at each room's door with a strict list: "only people wearing a web-tier badge may
enter the app-tier room." The badge (security group membership) matters, not the person's name (IP).

---

## 10. EC2, AMIs, Key Pairs

**What EC2 is.** Elastic Compute Cloud — rented virtual servers. You choose a size (e.g. `t3.small` =
2 vCPU, 2 GB RAM) and AWS gives you a running machine.

**What an AMI is.** An Amazon Machine Image — the starting disk for a server: the operating system and
any pre-installed software. When a server launches, it boots from an AMI. We use the latest **Amazon
Linux 2023** AMI, looked up automatically so we never hardcode an image ID that goes stale.

**What a Key Pair is.** For SSH access to a Linux server, you use a cryptographic key pair instead of
a password. You keep the private key file (`.pem`); AWS holds the public half. Only someone with the
private key can log in — much safer than passwords.

**How we use it.** We don't create individual EC2 instances by hand. Instead, *launch templates*
(§15) describe how a server should look, and *Auto Scaling Groups* (§16) create them automatically.
But every one of those is still an EC2 instance booting from the Amazon Linux AMI.

**Confusion to avoid.** "Instance type" (`t3.small`) is the *hardware size*. "AMI" is the *software
image*. Two different choices: how big the machine is, and what's on its disk.

---

## 11. RDS (Relational Database Service)

**What it is.** A managed database. You get a real PostgreSQL database, but AWS runs the hard parts:
backups, software patching, and failover.

**The problem it solves.** Running your own database server means babysitting backups, applying
security patches, and building a recovery plan for when the disk dies. RDS does all of that. You just
connect and use it.

**Key features we use:**
- **Multi-AZ.** RDS keeps a synchronized *standby* copy in a *different* Availability Zone. If the
  primary's data center fails, the standby is promoted automatically, usually within a minute or two.
  This is automatic disaster recovery.
- **DB Subnet Group.** RDS needs to be told which subnets it may live in — and it insists on at least
  two, in different AZs, precisely so it *can* do Multi-AZ. We give it the three isolated database
  subnets.
- **`publicly_accessible = false`.** The database gets no public address. Combined with the DB subnets
  having no internet route and the `db` security group only allowing the app tier, the database is
  genuinely unreachable from the internet.
- **Encrypted storage.** Data on disk is encrypted.

**How we use it.** PostgreSQL, Multi-AZ, in the three private DB subnets, behind the `db` security
group, with no public access. The app tier connects to it on port 5432; nothing else can.

**Analogy.** Renting a vault with a professional service that handles the locks, keeps duplicate
records in another building, and swaps in the backup vault instantly if one fails — versus buying a
safe and being personally responsible for all of that.

---

## 12. Secrets Manager

**What it is.** A secure, encrypted store for sensitive values — here, the database password.

**The problem it solves.** Passwords must never sit in your code or config files (which live in git,
where anyone with the repo sees them). Secrets Manager holds them encrypted, and applications fetch
them at runtime.

**How it works.** You store a secret (we store the whole DB connection: username, password, host,
port, database name, as one JSON blob). At startup, the application asks Secrets Manager for it — but
only if it has *permission* (see IAM, next). The password never appears in the code, the Terraform, or
the server's startup script.

**How we use it.** Terraform creates the secret from the database's details. The app tier's servers
read it when they boot to build their database connection string. This is the cloud end of a seam we
built into the backend: one config file reads the secret, and nothing else touches credentials.

**Analogy.** A locked key cabinet in the wall. The password isn't taped under the keyboard (in the
code); it's in the cabinet, and only staff with the right badge (IAM permission) can open it.

---

## 13. IAM (Identity and Access Management)

**What it is.** AWS's permission system — who (or what) is allowed to do which actions on which
resources.

**The pieces you need:**
- **Policy.** A document listing allowed actions, e.g. "may read secret X." 
- **Role.** A bundle of permissions that a *machine* (not a person) can assume. Unlike a user, a role
  has no password or permanent keys — it's temporary, assumed identities.
- **Instance Profile.** The wrapper that attaches a role to an EC2 server, so the server *is* that
  role and inherits its permissions.

**The problem it solves.** The app servers need to read the database password from Secrets Manager.
The naive way is to put AWS access keys on the server — but keys can leak, and a leaked key is a
disaster. Instead, the server *assumes a role* that grants exactly the one permission it needs. No
keys stored anywhere; AWS hands the server short-lived credentials automatically.

**Least privilege — the important principle.** Our policy grants `secretsmanager:GetSecretValue`
scoped to *one specific secret's address (ARN)* — not "all secrets," and certainly not "everything."
If the server were ever compromised, the attacker could read that one database secret and nothing
else. Writing `Resource = "*"` (everything) instead is the classic mistake; we deliberately don't.

**How we use it.** A role for the app tier → a policy allowing it to read only the DB secret → an
instance profile attaching that role to the app servers. That's how they get the password with zero
stored credentials.

**Analogy.** Instead of giving a contractor a master key to the whole building (a stored AWS key), you
give them a badge that opens exactly one door and expires — and the security desk (AWS) re-issues it
automatically.

---

## 14. Load Balancers (ALB)

**What it is.** An Application Load Balancer is a smart receptionist that receives incoming requests
and distributes them across several identical servers, skipping any that are unhealthy.

**The problem it solves.** One server can't handle unlimited traffic and is a single point of failure
— if it dies, the site's down. A load balancer puts many servers behind one address and automatically
stops sending traffic to broken ones.

**The moving parts:**
- **Listener.** "Listen on port 443 for HTTPS" (or 80 for HTTP). Defines what comes in.
- **Target Group.** The pool of servers to send traffic to, on a specific port. The ALB forwards to a
  target group.
- **Health Check.** The ALB periodically pings each server at a path (e.g. `/` or `/health`). Pass →
  it gets traffic. Fail → it's removed until it recovers. *This is why our backend has a `/health`
  endpoint — it exists precisely so the load balancer can check the app is alive.*

**Internet-facing vs internal — the key distinction:**
- An **internet-facing** ALB has a public address; anyone can reach it. Ours sits in the public
  subnets and is the site's front door (ports 80/443).
- An **internal** ALB has *no* public address — only things inside the VPC can reach it. Ours sits in
  the app subnets, and only the web tier's security group can talk to it. **This is what lets the app
  tier stay completely private while still being load-balanced.** The web servers proxy `/api`
  requests to the internal ALB's internal DNS name; the outside world never sees it.

**How we use it.** Two ALBs. Public one → web tier (health check `/`). Internal one → app tier on port
4000 (health check `/health`). The request path is: browser → public ALB → web server (nginx) →
internal ALB → app server.

**Analogy.** A receptionist who splits a queue of visitors across several identical counters and stops
directing people to a counter whose clerk has stepped away. The internal ALB is a *back-office*
receptionist the public never sees.

---

## 15. Launch Templates & User Data

**What a Launch Template is.** A blueprint for a server: which AMI, which size, which security group,
which key pair, and a startup script. It doesn't create a server by itself — it *describes* how one
should be made, so that auto scaling can stamp out identical copies on demand.

**What User Data is.** A script that runs automatically the *first time* a server boots. This is how a
plain Amazon-Linux server turns into a working web or app server without anyone logging in.

**How we use it — two templates:**
- **Web template.** Boots, installs nginx + Node, pulls the frontend code, builds the React app, and
  writes an nginx config that serves the build and proxies `/api` to the internal ALB. (Terraform
  injects the internal ALB's address into that config via a template.)
- **App template.** Boots, installs Node, pulls the backend, applies database migrations, and starts
  the API with pm2. It receives the *name* of the DB secret (not the password) so it can fetch
  credentials from Secrets Manager itself.

**The link to Secrets/IAM.** The app template also attaches the instance profile (§13), so the servers
it creates have permission to read the secret. Everything connects: template → profile → role →
policy → secret.

**Confusion to avoid.** A launch template creates *nothing* on its own. It's a recipe sitting on the
shelf. The Auto Scaling Group (next) is what actually uses it to make servers.

---

## 16. Auto Scaling Groups (ASG)

**What it is.** A manager that keeps a *target number* of identical servers running, spread across the
AZs, and automatically replaces any that die.

**The problem it solves — two things:**
1. **Self-healing.** You say "I always want 2 app servers." If one crashes or its whole AZ fails, the
   ASG notices (via health checks) and builds a replacement — no human, no downtime.
2. **The foundation for scaling.** Because the ASG can create and destroy servers on command, it can
   also grow and shrink the fleet based on load (next section).

**How it works.** You point the ASG at a launch template (the blueprint), give it the subnets to
spread across, attach it to the load balancer's target group (so new servers automatically start
receiving traffic), and set three numbers: **desired** (how many you want now), **min** (never go
below), **max** (never go above). The ASG constantly works to match reality to "desired," and uses ELB
health checks to decide if a server is alive.

**How we use it.** Two ASGs — web and app. Each spread across its three private subnets, attached to
its target group, with min/desired/max from variables (e.g. app: min 2, desired 2, max 4). A rolling
"instance refresh" replaces servers gradually when the template changes, so the service stays up during
updates.

**The demo this enables (worth a lot of marks).** Terminate a running instance on purpose. The ASG's
health check notices it's gone, and within a couple of minutes a replacement is built and serving
traffic — the site never went down. That resilience is the whole point.

**Analogy.** A shift manager who's told "always keep two clerks at the counter." If one goes home
sick, the manager immediately calls in a replacement. If it gets busy, they call in extras; when it's
quiet, they send some home.

---

## 17. Scaling Policies & CloudWatch

**What CloudWatch is.** AWS's monitoring service — it collects metrics like CPU usage from your
servers.

**What a Scaling Policy is.** A rule that tells the ASG to add or remove servers based on a metric.

**The problem it solves.** Traffic isn't constant — quiet at night, busy at launch. Manually adding
servers is slow and you'll always be wrong. A scaling policy does it automatically.

**How it works (target tracking).** We use the simplest, best kind: "keep average CPU near 50%."
CloudWatch watches the fleet's average CPU. If it climbs above 50% (busy), the ASG adds servers until
it drops back. If it falls well below (quiet), the ASG removes servers to save money. You set the
target; AWS does the math. It respects the ASG's min/max so it never scales to zero or infinity.

**How we use it.** A CPU target-tracking policy on both the web and app ASGs, targeting 50%. Under a
traffic spike, the fleets grow; when it passes, they shrink.

**Analogy.** A thermostat. You set 22°C; it turns the heating on when it's cold and off when it's warm.
You don't manage the furnace minute by minute — you set a target and it maintains it.

---

## 18. Route 53 (DNS)

**What DNS is.** The Domain Name System translates human names (`teamops.example.com`) into machine
addresses. It's the internet's phone book.

**What Route 53 is.** AWS's DNS service. "53" is the port DNS uses.

**The pieces:**
- **Hosted Zone.** Your control panel for one domain (`example.com`) — it holds all that domain's
  records. You create it once (and, for a domain you bought elsewhere, point the registrar at it).
- **Record.** An entry mapping a name to a destination. An **A record** maps a name to an address.
- **Alias record.** A special AWS record that points a name directly at an AWS resource (like our load
  balancer) and tracks it even as the load balancer's underlying addresses change. Better than a
  plain A record for this.

**The problem it solves.** Users can't type a load balancer's ugly auto-generated address. They type
`teamops.example.com`, and DNS quietly turns that into the load balancer's address.

**How we use it.** An alias record pointing `teamops.<yourdomain>` at the public ALB. Now the domain
name reaches the site's front door.

**Analogy.** Saved contacts on your phone. You tap "Mum," not her 10-digit number. If she changes
numbers, you update the contact once and keep tapping "Mum." DNS is that contact list for the internet.

---

## 19. ACM & HTTPS

**What HTTPS is.** The secure, encrypted version of HTTP (the padlock in the browser). It stops others
from reading or tampering with traffic between the user and the site. Browsers now warn on plain HTTP,
so HTTPS is mandatory.

**What a certificate is.** HTTPS needs an SSL/TLS *certificate* — a file that proves you own the domain
and enables the encryption. It must be issued by a trusted authority.

**What ACM is.** AWS Certificate Manager issues these certificates **free** and renews them
automatically (expired certificates are a classic outage cause — ACM removes that risk).

**DNS validation.** To issue a certificate, ACM must confirm you actually control the domain. It does
this by asking you to add a specific DNS record; when it sees that record (via Route 53), it knows
you're the owner and issues the cert. Terraform creates that validation record automatically.

**TLS termination.** The encryption is "terminated" (decrypted) at the load balancer. So traffic is
encrypted from the user's browser to the public ALB; inside the VPC (ALB → web → app), it's plain HTTP
— which is fine because that's all private network. This is standard and keeps the servers simpler.

**How we use it.** ACM issues a certificate for `teamops.<yourdomain>`, validated via a Route 53
record. The public ALB gets an HTTPS listener on port 443 using that certificate. Users get the
padlock.

**Analogy.** A tamper-proof, sealed envelope (HTTPS) for the journey from the user to your front desk
(the ALB), where it's opened. The certificate is the official wax seal proving the envelope really came
from your address.

---

## 20. Terraform State & Modules

Two Terraform concepts that aren't AWS services but are essential to how we build.

### State
- **What it is.** Terraform's memory — a file recording everything it has created and each resource's
  real-world ID, so it knows what already exists.
- **Why it matters.** Without state, Terraform couldn't tell "create a new VPC" from "the VPC already
  exists, leave it." State is how `plan` knows the difference between current and desired.
- **Why we store it in S3.** On your laptop the state file can be lost, isn't shareable, and can hold
  secrets in plain text. In an S3 bucket it's durable, shared, and — with locking — safe from two
  people applying at once and corrupting it.
- **Confusion to avoid.** Never edit or commit the state file by hand. Treat it as Terraform's private
  bookkeeping.

### Modules
- **What it is.** A reusable, self-contained package of Terraform (like a function in code). Our `vpc`,
  `security`, `rds`, `alb`, `compute`, and `dns` folders are each a module.
- **Why we use them.** They keep the code organized, each with clear inputs (`variables.tf`) and
  outputs (`outputs.tf`), and let one module hand values to another (the VPC module outputs subnet IDs
  that the ALB module consumes). The root `main.tf` just wires the modules together.
- **Analogy.** Functions. You don't write one giant script; you write small, named, reusable pieces
  and call them.

---

## Putting it all together — the whole stack in one breath

You describe a **private network (VPC)** using **CIDR** ranges, carved into **subnets** across three
**Availability Zones**. **Route tables** decide each subnet's fate: public ones point at the
**Internet Gateway**, private ones at a **NAT Gateway** (outbound-only), the database ones at nothing
(sealed). **Security groups** let each tier accept traffic only from the tier in front of it, by
referencing each other rather than IPs. A managed **RDS** PostgreSQL database sits in the sealed
subnets, its password vaulted in **Secrets Manager** and handed to app servers via an **IAM** role and
**instance profile** — never stored. Two **load balancers** (a public one and an internal one) spread
traffic across **auto-scaling** fleets of servers, each built from a **launch template** whose **user
data** installs and starts the app, and each fleet kept healthy and right-sized by the **ASG** and its
**CloudWatch** scaling policy. **Route 53** gives it a real name and **ACM** gives it HTTPS. All of it
is **Terraform** code, tracked in **state** in S3, organized as **modules** — built and destroyed with
a single command.

That is the 3-tier architecture, and now you know every piece in it.
