# Remote state in S3.
#
# Terraform records everything it creates in a state file. Kept locally it is
# fragile (one machine, easy to lose, can't be shared) and it can contain
# secrets in plaintext. Storing it in S3 makes it durable, shareable, and — with
# use_lockfile — safe against two applies running at once.
#
# Chicken-and-egg: the bucket must exist before `terraform init`. Create it once,
# by hand or a small bootstrap, before initialising this configuration:
#
#   aws s3api create-bucket --bucket teamops-tfstate-<unique> \
#     --region ap-south-1 --create-bucket-configuration LocationConstraint=ap-south-1
#   aws s3api put-bucket-versioning --bucket teamops-tfstate-<unique> \
#     --versioning-configuration Status=Enabled
#
# Then run: terraform init
terraform {
  backend "s3" {
    bucket       = "teamops-tfstate-change-me"
    key          = "teamops/terraform.tfstate"
    region       = "ap-south-1"
    encrypt      = true
    use_lockfile = true
  }
}
