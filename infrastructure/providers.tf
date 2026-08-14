# The AWS provider. The region comes from a variable so the same code can target
# different regions without edits.
provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project   = "TeamOps"
      ManagedBy = "Terraform"
    }
  }
}
