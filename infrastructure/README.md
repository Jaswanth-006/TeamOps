# TeamOps Infrastructure

Terraform for the TeamOps 3-tier AWS architecture: VPC, security groups, RDS PostgreSQL, Secrets
Manager, public + internal load balancers, auto-scaling web and app tiers, and Route 53 + HTTPS.

See `docs/3-tier-explained.md` and `docs/devops-guide.md` for the concepts, and
`docs/infrastructure-implementation.md` for how it was built.

## Layout

```
infrastructure/
├── versions.tf / providers.tf / backend.tf   # Terraform + AWS + remote state
├── variables.tf / dev.tfvars                  # inputs and dev values
├── data.tf                                    # AMI lookup
├── main.tf / outputs.tf                        # module composition + outputs
└── modules/
    ├── vpc/        # VPC, 12 subnets, IGW, NAT, route tables
    ├── security/   # tier-to-tier security groups
    ├── rds/        # PostgreSQL (Multi-AZ, private)
    ├── secrets/    # DB credentials in Secrets Manager
    ├── alb/        # public + internal load balancers
    ├── compute/    # IAM, launch templates, ASGs, scaling
    └── dns/        # Route 53 + ACM + HTTPS
```

## Prerequisites (create these once, before `apply`)

1. **An S3 bucket for state**, then set its name in `backend.tf`:
   ```
   aws s3api create-bucket --bucket teamops-tfstate-<unique> \
     --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
   aws s3api put-bucket-versioning --bucket teamops-tfstate-<unique> \
     --versioning-configuration Status=Enabled
   ```
2. **An EC2 key pair** named to match `key_name` in `dev.tfvars`.
3. **A Route 53 hosted zone** for your domain; set `hosted_zone_name` in `dev.tfvars`.
4. Edit `dev.tfvars`: set `ssh_allowed_cidr` to your IP, and supply a real `db_password`
   (prefer `-var` or an environment variable over committing it).

## Deploy

```
cd infrastructure
terraform init          # connects to the S3 backend
terraform fmt -check    # formatting
terraform validate      # syntax + references
terraform plan  -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

When it finishes, `terraform output site_url` prints the HTTPS address.

## Destroy (do this when you stop working — NAT + ALBs + RDS bill hourly)

```
terraform destroy -var-file=dev.tfvars
```

## Notes

- **Single NAT gateway** — a cost/HA trade-off; production would run one per AZ.
- **AMIs** are the latest Amazon Linux 2023 via a data source; instances install software on boot.
  The Packer phase would replace these with pre-baked images for faster startup.
- **No secrets in code** — the database password lives in Secrets Manager; the app tier reads it at
  boot via an IAM instance profile scoped to that one secret.
- **Not yet applied** — this configuration is written and reviewed but has not been run against a
  live account. Run `terraform validate` (free, no resources created) as the first check.
```
