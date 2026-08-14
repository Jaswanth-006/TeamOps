output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "web_subnet_ids" {
  description = "IDs of the web-tier private subnets"
  value       = aws_subnet.web[*].id
}

output "app_subnet_ids" {
  description = "IDs of the app-tier private subnets"
  value       = aws_subnet.app[*].id
}

output "db_subnet_ids" {
  description = "IDs of the database private subnets"
  value       = aws_subnet.db[*].id
}
