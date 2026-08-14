# Root composition — wires the modules together. Modules are added here as they
# are built.

module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  public_subnet_cidrs = var.public_subnet_cidrs
  web_subnet_cidrs    = var.web_subnet_cidrs
  app_subnet_cidrs    = var.app_subnet_cidrs
  db_subnet_cidrs     = var.db_subnet_cidrs
}

module "security" {
  source = "./modules/security"

  environment      = var.environment
  vpc_id           = module.vpc.vpc_id
  ssh_allowed_cidr = var.ssh_allowed_cidr
}

module "rds" {
  source = "./modules/rds"

  environment          = var.environment
  db_subnet_ids        = module.vpc.db_subnet_ids
  db_security_group_id = module.security.db_sg_id
  instance_class       = var.db_instance_class
  engine_version       = var.db_engine_version
  allocated_storage    = var.db_allocated_storage
  multi_az             = var.db_multi_az
  db_username          = var.db_username
  db_password          = var.db_password
  db_name              = var.db_name
}

module "secrets" {
  source = "./modules/secrets"

  environment = var.environment
  db_username = var.db_username
  db_password = var.db_password
  db_host     = module.rds.db_address
  db_port     = module.rds.db_port
  db_name     = var.db_name
}
