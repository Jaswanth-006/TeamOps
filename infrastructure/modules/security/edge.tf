# The two outermost firewalls — the only groups that accept traffic from outside
# the VPC. Everything deeper accepts traffic only from another security group.

# Bastion: the single SSH entry point to private instances. SSH from your IP only.
resource "aws_security_group" "bastion" {
  name        = "teamops-bastion-sg-${var.environment}"
  description = "SSH access to the bastion host"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from the allowed admin IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "teamops-bastion-sg-${var.environment}"
  }
}

# Public ALB: accepts web traffic from the entire internet.
resource "aws_security_group" "public_alb" {
  name        = "teamops-public-alb-sg-${var.environment}"
  description = "HTTP/HTTPS from the internet to the public load balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "teamops-public-alb-sg-${var.environment}"
  }
}
