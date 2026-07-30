output "bastion_sg_id" {
  value = aws_security_group.bastion_sg.id
}

output "frontend_alb_sg_id" {
  value = aws_security_group.frontend_alb_sg.id
}

output "web_sg_id" {
  value = aws_security_group.web_sg.id
}

output "app_alb_internal_sg_id" {
  value = aws_security_group.app_alb_internal_sg.id
}

output "app_sg_id" {
  value = aws_security_group.app_sg.id
}

output "db_sg_id" {
  value = aws_security_group.db_sg.id
}
