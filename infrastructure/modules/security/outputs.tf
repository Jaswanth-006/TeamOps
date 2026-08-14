output "bastion_sg_id" {
  value = aws_security_group.bastion.id
}

output "public_alb_sg_id" {
  value = aws_security_group.public_alb.id
}
