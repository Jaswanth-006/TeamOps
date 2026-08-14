# Web tier and internal ALB firewalls. Note that ingress sources are other
# security groups (by id), not IP ranges — so the rules keep working as
# instances scale and change IPs.

# Web tier (nginx): accepts HTTP only from the public ALB, and SSH from the
# bastion for maintenance.
resource "aws_security_group" "web" {
  name        = "teamops-web-sg-${var.environment}"
  description = "Web tier: HTTP from the public ALB, SSH from the bastion"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from the public ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.public_alb.id]
  }

  ingress {
    description     = "SSH from the bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "teamops-web-sg-${var.environment}"
  }
}

# Internal ALB: accepts HTTP only from the web tier. Not reachable from the
# internet — this is what keeps the app tier private.
resource "aws_security_group" "internal_alb" {
  name        = "teamops-internal-alb-sg-${var.environment}"
  description = "Internal ALB: HTTP from the web tier only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTP from the web tier"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "teamops-internal-alb-sg-${var.environment}"
  }
}
