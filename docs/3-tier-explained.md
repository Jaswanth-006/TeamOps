# 3-Tier Architecture, Explained Simply

Written for someone who has built apps but is new to how they're deployed in the cloud. No code —
just the ideas, end to end, using our TeamOps project as the example.

---

## The one-sentence version

A **3-tier architecture** splits an application into three separate layers — the part users see, the
part that thinks, and the part that remembers — and puts each on its own machines so they can be
secured, scaled, and fixed independently.

---

## The three tiers, with a shopfront analogy

Imagine a bank branch:

| Tier | In a bank | In our app | Its job |
|------|-----------|------------|---------|
| **1 — Presentation** | The lobby & counter staff you talk to | **nginx + the React app** | Show things to the user; take their clicks |
| **2 — Application** | The back office that processes your request | **the Express API** | The rules and logic — "can this person do this?", "create that project" |
| **3 — Data** | The vault where records are kept | **PostgreSQL (RDS)** | Store and retrieve the actual data |

You (the customer) only ever talk to the **lobby**. You never walk into the back office, and you
*definitely* never walk into the vault. The lobby passes your request to the back office; the back
office is the only one allowed to open the vault. That separation is the whole idea.

---

## Why split it up at all? (You could put everything on one server.)

You *could* — and many student projects do. Everything on one public machine. It works until it
doesn't, and here's what the split buys you:

- **Security.** If the database is on its own isolated machine that only the app can reach, then even
  if a hacker breaks into the website, they still can't touch the database directly. In our design
  the database has *no route to the internet at all* — it's genuinely unreachable from outside.
- **Scaling.** A traffic spike usually hammers one tier, not all three. If lots of people are
  *browsing*, you add web servers. If lots of people are *saving data*, you add app servers. You
  scale the part under pressure instead of over-buying whole servers.
- **Failure isolation.** If one web server dies, the others keep serving. If the database's machine
  fails, a standby copy takes over. One broken part doesn't take the whole system down.
- **Clarity.** Each tier does one job. Easier to reason about, easier to fix.

---

## How a single click travels through our system

Say a user clicks **"Create Project"**. Here's the whole journey:

1. **The browser** sends the request to our domain. DNS (Route 53) points that domain at our front
   door — the **public load balancer**.
2. The **public load balancer** picks a healthy **web server** and forwards the request. (It also
   handles HTTPS, so traffic is encrypted up to this point.)
3. The **web server** (nginx) notices the request starts with `/api/`, so instead of serving a web
   page it **forwards it to the internal load balancer**.
4. The **internal load balancer** — which the outside world can't even see — picks a healthy **app
   server** and forwards the request.
5. The **app server** (Express) checks permissions, then opens a connection to the **database** and
   writes the new project.
6. The response travels back up the same chain to the browser, and the project appears.

The magic detail: **at no point does the browser know the app server or database exist.** It only
ever talked to the front door. Everything behind it is private.

---

## The supporting cast (things that aren't "tiers" but make it work)

Real deployments need a few extra pieces around the three tiers:

- **VPC (Virtual Private Cloud):** your own private slice of the cloud — a walled compound with its
  own internal address system. Everything lives inside it.
- **Subnets:** rooms inside the compound. Some rooms have a door to the street (**public**), most
  don't (**private**). Our tiers live in private rooms.
- **Internet Gateway:** the street door of the compound. Only public rooms connect to it.
- **NAT Gateway:** a one-way mail slot. Private rooms can send mail *out* (to download software
  updates) but nobody outside can send mail *in*. This is how private servers get updates without
  being exposed.
- **Load Balancers:** receptionists who spread visitors across identical servers and stop sending
  people to a server that's broken.
- **Security Groups:** the guards at each room's door with a strict guest list — "only the web tier
  may enter the app tier's room; only the app tier may enter the database's room."
- **Bastion host:** a single guarded side-door for the administrator (you) to SSH into private
  machines for maintenance. The only way in.
- **Auto Scaling Group:** a manager who watches how busy each tier is and hires or fires identical
  servers automatically — and instantly replaces any that die.
- **Secrets Manager:** a locked key cabinet. The database password lives here, not in the code. App
  servers are given a key to open just that one cabinet.

---

## Why this is exactly what we're building

Our TeamOps app maps perfectly onto this:

```
Browser
   │  (HTTPS, via Route 53 DNS)
   ▼
Public Load Balancer          ← the front door, in a public subnet
   │
   ▼
Web Tier: nginx + React        ← private subnets, behind an Auto Scaling Group
   │  (forwards /api/* only)
   ▼
Internal Load Balancer         ← invisible to the internet
   │
   ▼
App Tier: Express API          ← private subnets, behind an Auto Scaling Group
   │  (fetches the DB password from Secrets Manager)
   ▼
Data Tier: PostgreSQL (RDS)    ← most isolated private subnets, no internet at all
```

Everything you built into the app was designed for this: the React app calls **relative `/api`
URLs** so nginx can route them; the backend has a **`/health`** endpoint so the load balancer can
check it's alive; the database password is read from **one config file** so it can come from Secrets
Manager on AWS; and the app runs its **database migrations on boot** so a fresh database sets itself
up.

---

## The payoff you can demonstrate

Because of this design, you can stand in front of an examiner and:

- Open the site over HTTPS — it works.
- Create a project — it saves to a database that has no public address.
- **Delete a running server on purpose** — the system notices, routes around it, and builds a
  replacement, all while the site stays up.

That resilience isn't luck. It's what the three tiers, the load balancers, and the auto scaling
groups are *for*.
