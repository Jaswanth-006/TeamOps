# The VPC — the isolated private network that every other resource lives inside.
# DNS support and hostnames are enabled so instances and RDS can resolve names
# (RDS endpoints and EC2 private DNS depend on this).
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "teamops-vpc-${var.environment}"
  }
}
