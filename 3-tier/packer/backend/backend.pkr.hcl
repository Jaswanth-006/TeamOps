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

source "amazon-ebs" "backend" {
  region          = var.aws_region
  ami_name        = "three-tier-backend"
  ami_description = "Custom backend AMI with Node.js 22 + PM2 (Amazon Linux 2023)"
  
  instance_type = "t3.micro"
  ssh_username  = "ec2-user"
  
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
    Name    = "three-tier-backend"
    Project = "three-tier"
    Tier    = "backend"
  }

  run_tags = {
    Name    = "packer-builder-backend"
    Project = "three-tier"
  }
}

build {
  sources = ["source.amazon-ebs.backend"]

  provisioner "shell" {
    script = "setup.sh"
  }

  post-processor "manifest" {
    output     = "../ami_ids/backend_manifest.json"
    strip_path = true
  }
}
