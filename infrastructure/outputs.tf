# Top-level outputs. More are added as modules come online.

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "web_subnet_ids" {
  value = module.vpc.web_subnet_ids
}

output "app_subnet_ids" {
  value = module.vpc.app_subnet_ids
}

output "db_subnet_ids" {
  value = module.vpc.db_subnet_ids
}

output "db_endpoint" {
  description = "Database endpoint (host:port)"
  value       = module.rds.db_endpoint
}

output "public_alb_dns_name" {
  description = "Public entry point — the site's front door"
  value       = module.alb.public_alb_dns_name
}

output "internal_alb_dns_name" {
  description = "Internal ALB DNS — nginx proxies /api here"
  value       = module.alb.internal_alb_dns_name
}
