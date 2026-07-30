packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
}

source "amazon-ebs" "frontend" {
  region          = var.aws_region
  ami_name        = "three-tier-frontend"
  ami_description = "Custom frontend AMI with nginx + git + Node.js 22 (Amazon Linux 2023)"
  
  instance_type = "t3.micro"
  ssh_username  = "ec2-user"
  
  # Amazon Linux 2023 AMI ID for ap-south-1 (verify this ID or use a filter)
  # Using a filter to always get the latest AL2023
  source_ami_filter {
    filters = {
      name                = "al2023-ami-2023.*-x86_64"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["amazon"]
  }

  tags = {
    Name    = "three-tier-frontend"
    Project = "three-tier"
    Tier    = "frontend"
  }

  run_tags = {
    Name    = "packer-builder-frontend"
    Project = "three-tier"
  }
}

build {
  sources = ["source.amazon-ebs.frontend"]

  provisioner "shell" {
    script = "setup.sh"
  }

  post-processor "manifest" {
    output     = "../ami_ids/frontend_manifest.json"
    strip_path = true
  }
}
