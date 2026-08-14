# A DB subnet group tells RDS which subnets it may live in. It needs at least
# two subnets in different AZs so a Multi-AZ standby can exist in another AZ.
resource "aws_db_subnet_group" "main" {
  name       = "teamops-db-subnets-${var.environment}"
  subnet_ids = var.db_subnet_ids

  tags = {
    Name = "teamops-db-subnets-${var.environment}"
  }
}

# The managed PostgreSQL database.
# - multi_az: keeps a synchronous standby in another AZ for automatic failover.
# - publicly_accessible = false: no public endpoint; only the app tier and the
#   bastion (via db_sg) can reach it, inside the private subnets.
resource "aws_db_instance" "main" {
  identifier     = "teamops-db-${var.environment}"
  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.db_security_group_id]

  multi_az            = var.multi_az
  publicly_accessible = false

  backup_retention_period = 7
  skip_final_snapshot     = true
  deletion_protection     = false

  tags = {
    Name = "teamops-db-${var.environment}"
  }
}
