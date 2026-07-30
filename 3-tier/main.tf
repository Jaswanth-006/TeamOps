module "vpc" {
  source             = "./modules/vpc"
  cidr_block         = var.vpc_cidr_block
  alb_subnet_public  = var.alb_subnet_public
  web_subnet_private = var.web_subnet_private
  app_subnet_private = var.app_subnet_private
  db_subnet_private  = var.db_subnet_private
  tags               = var.tags
}

module "sg" {
  source = "./modules/sg"
  vpc_id = module.vpc.vpc_id

  depends_on = [module.vpc]
}

module "rds" {
  source = "./modules/rds"

  instance_class = var.db_instance_class
  engine         = var.db_engine
  engine_version = var.db_engine_version

  parameter_group_name = var.db_parameter_group_name

  storage_encrypted = var.storage_encrypted
  allocated_storage = var.db_allocated_storage
  storage_type      = var.db_storage_type

  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [module.sg.db_sg_id]
  subnet_ids             = module.vpc.db_subnet_private

  multi_az            = var.multi_az
  publicly_accessible = var.publicly_accessible

  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  skip_final_snapshot          = var.skip_final_snapshot
  deletion_protection          = var.deletion_protection
  apply_immediately            = var.apply_immediately
  performance_insights_enabled = var.performance_insights_enabled

  depends_on = [module.vpc]
}

module "secrets" {
  source      = "./modules/secrets"
  secret_name = "backend-db-credentials-${terraform.workspace}"
  db_username = var.secret_username
  db_password = var.secret_password
  db_endpoint = module.rds.db_instance_endpoint
  db_name     = var.secret_db_name

  depends_on = [module.rds]
}



module "asg" {
  source = "./modules/asg"

  vpc_id              = module.vpc.vpc_id
  public_subnets      = module.vpc.alb_subnet_public
  web_private_subnets = module.vpc.web_subnet_private
  app_private_subnets = module.vpc.app_subnet_private

  frontend_alb_sg_id = module.sg.frontend_alb_sg_id
  backend_alb_sg_id  = module.sg.app_alb_internal_sg_id

  web_sg_id = module.sg.web_sg_id
  app_sg_id = module.sg.app_sg_id

  key_name        = var.bastion_key_name
  certificate_arn = data.aws_acm_certificate.selected.arn

  desired_capacity_web = var.desired_capacity_web
  min_size_web         = var.min_size_web
  max_size_web         = var.max_size_web

  desired_capacity_app = var.desired_capacity_app
  min_size_app         = var.min_size_app
  max_size_app         = var.max_size_app

  # Using dynamic AMI from data source
  web_image_id         = data.aws_ami.frontend.id
  app_image_id         = data.aws_ami.backend.id
  web_instance_type    = var.web_instance_type
  app_instance_type    = var.app_instance_type
  web_user_data_base64 = base64encode(file("web_user_data.sh"))
  app_user_data_base64 = base64encode(templatefile("app_user_data.sh", {
    region       = var.region
    secret_name  = module.secrets.secret_name
    environment  = terraform.workspace
    project_name = "vpc-alb"
  }))

  secret_arn    = module.secrets.secret_arn
  sns_topic_arn = var.sns_topic_arn

  depends_on = [module.secrets]
}

module "route53" {
  source           = "./modules/route53"
  hosted_zone_name = var.hosted_zone_name
  record_name      = var.record_name
  alb_dns_name     = module.asg.web_alb_dns_name
  alb_zone_id      = module.asg.web_alb_zone_id

}


module "bastion" {
  source = "./modules/bastion-server"

  image_id        = var.bastion_image_id
  instance_type   = var.bastion_instance_type
  subnet_id       = module.vpc.alb_subnet_public[0]
  security_groups = [module.sg.bastion_sg_id]
  key_name        = var.bastion_key_name

  depends_on = [module.sg]

  tags = {
    Name        = "bastion-${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "bastion"
  }
}
