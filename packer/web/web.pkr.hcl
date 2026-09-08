# Packer template for the WEB tier golden AMI.
#
# Bakes the runtime (nginx + Node + git) into a custom image on top of Amazon
# Linux 2023, so instances launched by the Auto Scaling Group boot ready to
# serve instead of spending minutes installing software. The application code
# itself is still pulled and built at boot (it changes); only the runtime is
# pre-installed here.
#
# Build:  cd packer/web && packer init . && packer build .
# Result: an AMI named "teamops-web-<timestamp>" that Terraform looks up.

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

source "amazon-ebs" "web" {
  region          = var.region
  ami_name        = "teamops-web-{{timestamp}}"
  ami_description = "TeamOps web tier — nginx + Node 22 on Amazon Linux 2023"
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
    Name    = "teamops-web"
    Project = "TeamOps"
    Tier    = "web"
  }
}

build {
  sources = ["source.amazon-ebs.web"]

  provisioner "shell" {
    script = "setup.sh"
  }
}
