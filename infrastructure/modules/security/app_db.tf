# App tier and database firewalls — the deepest links in the chain.

# App tier (Express on port 4000): accepts traffic only from the internal ALB,
# and SSH from the bastion.
resource "aws_security_group" "app" {
  name        = "teamops-app-sg-${var.environment}"
  description = "App tier: port 4000 from the internal ALB, SSH from the bastion"
  vpc_id      = var.vpc_id

  ingress {
    description     = "API traffic from the internal ALB"
    from_port       = 4000
    to_port         = 4000
    protocol        = "tcp"
    security_groups = [aws_security_group.internal_alb.id]
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
    Name = "teamops-app-sg-${var.environment}"
  }
}

# Database (PostgreSQL on 5432): accepts connections only from the app tier and
# from the bastion (for migrations and admin). Nothing else can reach it.
resource "aws_security_group" "db" {
  name        = "teamops-db-sg-${var.environment}"
  description = "Database: 5432 from the app tier and the bastion only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from the app tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "PostgreSQL from the bastion (migrations, admin)"
    from_port       = 5432
    to_port         = 5432
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
    Name = "teamops-db-sg-${var.environment}"
  }
}
