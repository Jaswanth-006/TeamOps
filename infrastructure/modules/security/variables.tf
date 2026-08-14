variable "environment" {
  description = "Environment name for tags"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC the security groups belong to"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH to the bastion (ideally your IP/32)"
  type        = string
}
