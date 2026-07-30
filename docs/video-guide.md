# Video Guide — Piyush "30 Days of AWS Terraform"

Watch these **in parallel with the build**, each one right before the phase that uses it — not
all up front. The point is to watch a video the same day you use what it teaches, so it sticks.

Legend: ⭐ essential · ➕ useful, watch if time · ⏭️ skip (out of scope for TeamOps)

---

## Watch NOW (before touching anything) — ~90 min
| Video | Why |
|---|---|
| ⭐ Day 0 — intro/overview | Sets up the whole series |
| ⭐ 1/30 — How Terraform Works / IaC | The mental model: what Terraform *is* |
| ⭐ 2/30 — AWS Provider explained | How Terraform talks to AWS |

Then **stop watching** and start Phase 0 (AWS account, IAM, tools — no Terraform needed yet).

---

## Phase 3 — Terraform foundations (rebuild your VPC as code)
*Watch these as you write your first `.tf` files.*
| Video | Maps to |
|---|---|
| ⭐ 3/30 — Create an S3 Bucket | Your literal first Terraform resource |
| ⭐ 6/30 — Project Structure Best Practices | How to lay out `infrastructure/` |
| ⭐ 5/30 — Variables (input/output/local) | Pulling hardcoded values into `variables.tf` + `dev.tfvars` |
| ⭐ 8/30 — Meta Arguments (count, for_each, depends_on) | 3 subnets × 3 AZs without copy-paste |
| ⭐ 13/30 — Data Sources | Looking up AZs and AMIs |
| ➕ 7/30 — Type Constraints | Deeper on variable types — watch if variables feel shaky |

---

## Phase 4 — Single-instance deploy + remote state + modules
| Video | Maps to |
|---|---|
| ⭐ 4/30 — State file / Remote Backend with S3 | Moving your state to S3 |
| ⭐ 19/30 — Provisioners (local/remote/file) | `user_data` / boot scripts |
| ⭐ 20/30 — Custom Modules | Refactoring into `modules/vpc`, `modules/sg`, etc. *(his example is EKS — ignore the EKS part, learn the **module structure**)* |
| ➕ 9/30 — Lifecycle Rules | `prevent_destroy`, `ignore_changes` — you'll meet these on RDS |

---

## Phase 5 — The 3-tier architecture ⭐ THE BIG ONE
| Video | Maps to |
|---|---|
| ⭐⭐ **28/30 — AWS 3-tier Architecture End-to-End** | **This is your entire project in one video.** Watch AFTER Phase 2 (manual build), then again during Phase 5. Understand it, then close it and write your own — do NOT copy his code. |
| ➕ 22/30 — 2-Tier Architecture | Lighter warm-up for #28 if the big one feels like too much at once |
| ➕ 10/30 — Conditionals / Dynamic Blocks | Handy for writing security-group rules cleanly |

---

## Phase 6 — Secrets & IAM
| Video | Maps to |
|---|---|
| ➕ 16/30 — IAM User Management | IAM concepts (his focus is users; you need roles + instance profiles — concepts transfer) |
| ➕ 21/30 — Policy & Governance | IAM policy structure |

*Note: the playlist has no dedicated Secrets Manager video. I'll walk you through that part directly.*

---

## Phase 7 — Resilience / HA / Autoscaling 🎯
| Video | Maps to |
|---|---|
| ⭐ 24/30 — Highly Available & Scalable Architecture | ASGs, scaling, Multi-AZ — directly your Phase 7 |

---

## Phase 8 (optional environments)
| Video | Maps to |
|---|---|
| ➕ 26/30 — HCP / Projects & Workspaces | Terraform **workspaces** part is relevant for dev/prod. Ignore the paid HCP cloud part. |

---

## ⚠️ Gap: Packer
The playlist has **no Packer content at all**. When you reach Phase 8 (golden AMIs), you'll adapt
the templates in `3-tier/packer/` and I'll explain them. Don't go hunting for it in this series.

---

## ⏭️ SKIP for TeamOps (out of scope — great videos, wrong project)
| Video | Why skip |
|---|---|
| 11/30, 12/30 — Functions Part 1 & 2 | Reference material; dip in only if a specific function confuses you |
| 14/30 — S3 + CloudFront static site | Not your architecture |
| 15/30 — VPC Peering | Single VPC project |
| 17/30 — Elastic Beanstalk Blue-Green | You're doing raw EC2, not Beanstalk |
| 18/30 — Lambda image processing | Serverless — out of scope |
| 23/30 — Observability | Nice-to-have, not required for the grade |
| 25/30 — Terraform Import | For adopting existing infra; you build fresh |
| 27/30 — GitHub Actions CI/CD | Out of scope (PRD §8) |
| 29/30 — GitOps / ArgoCD / EKS | Kubernetes — out of scope |
| 30/30 — Drift Detection + GH Actions | Out of scope |
| "50 Early Winners" announcement | Not a lesson |

---

## Summary count
- **Watch now:** 3 videos (~90 min)
- **Essential across the build:** ~10 videos
- **Useful extras:** ~5 videos
- **Skip:** ~11 videos

You watch roughly **half** the playlist, spread across the project — not 17 hours up front.
