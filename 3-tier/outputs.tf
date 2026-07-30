output "db_instance_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "app_alb_dns_name" {
  value = module.asg.app_alb_dns_name
}

output "web_alb_dns_name" {
  value = module.asg.web_alb_dns_name
}

output "bastion_public_ip" {
  value = module.bastion.bastion_public_ip
}

