# Look up the latest Amazon Linux 2023 AMI so we don't hardcode an image id that
# changes over time. Both tiers boot from it and install their software via user
# data. (In the Packer phase, these would point at custom pre-baked AMIs.)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}
