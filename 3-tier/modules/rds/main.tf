# DB subnets group

resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "db_subnet_group"
  subnet_ids = var.subnet_ids
  tags = {
    Name        = "db_subnet_group_${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "Database"
  }
}

# RDS SQL DB instance

resource "aws_db_instance" "db_instance" {
  identifier     = "db-instance-${terraform.workspace}"
  instance_class = var.instance_class
  engine         = var.engine
  engine_version = var.engine_version

  parameter_group_name = var.parameter_group_name

  storage_encrypted = var.storage_encrypted
  allocated_storage = var.allocated_storage
  storage_type      = var.storage_type

  username = var.username
  password = var.password

  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = aws_db_subnet_group.db_subnet_group.name

  multi_az            = var.multi_az
  publicly_accessible = var.publicly_accessible

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  skip_final_snapshot          = var.skip_final_snapshot
  deletion_protection          = var.deletion_protection
  apply_immediately            = var.apply_immediately
  performance_insights_enabled = var.performance_insights_enabled

  tags = {
    Name        = "db_instance_${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "DB"
  }

  lifecycle {
    prevent_destroy = false
    ignore_changes  = [tags]

  }
}
