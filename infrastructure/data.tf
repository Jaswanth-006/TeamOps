# Look up the golden AMIs built by Packer (see packer/). These are owned by this
# account and pre-bake each tier's runtime, so instances boot ready to serve.
# Build the images with `packer build` before `terraform apply`.

data "aws_ami" "web" {
  most_recent = true
  owners      = ["self"]

  filter {
    name   = "name"
    values = ["teamops-web-*"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}

data "aws_ami" "app" {
  most_recent = true
  owners      = ["self"]

  filter {
    name   = "name"
    values = ["teamops-app-*"]
  }

  filter {
    name   = "state"
    values = ["available"]
  }
}
