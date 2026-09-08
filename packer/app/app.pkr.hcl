# Packer template for the APP tier golden AMI.
#
# Bakes the runtime (Node + pm2 + git) into a custom image on top of Amazon
# Linux 2023, so app instances boot ready to run instead of installing Node and
# pm2 first. The backend code and its npm dependencies are still installed at
# boot (they change); only the runtime is pre-installed here.
#
# Build:  cd packer/app && packer init . && packer build .
# Result: an AMI named "teamops-app-<timestamp>" that Terraform looks up.

packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "region" {
  type    = string
  default = "ap-south-1"
}

source "amazon-ebs" "app" {
  region          = var.region
  ami_name        = "teamops-app-{{timestamp}}"
  ami_description = "TeamOps app tier — Node 22 + pm2 on Amazon Linux 2023"
  instance_type   = "t3.micro"
  ssh_username    = "ec2-user"

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
    Name    = "teamops-app"
    Project = "TeamOps"
    Tier    = "app"
  }
}

build {
  sources = ["source.amazon-ebs.app"]

  provisioner "shell" {
    script = "setup.sh"
  }
}
