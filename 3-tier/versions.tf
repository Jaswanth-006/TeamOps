terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.27.0"
    }
  }
}

terraform {
  required_version = ">= 1.14.0, < 1.16.0"
}
