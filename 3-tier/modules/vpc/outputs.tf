output "vpc_id" {
  value = aws_vpc.main.id
}

output "alb_subnet_public" {
  value = aws_subnet.alb_subnet_public[*].id
}

output "web_subnet_private" {
  value = aws_subnet.web_subnet_private[*].id
}

output "app_subnet_private" {
  value = aws_subnet.app_subnet_private[*].id
}

output "db_subnet_private" {
  value = aws_subnet.db_subnet_private[*].id
}
