output "db_address" {
  description = "Hostname of the database"
  value       = aws_db_instance.main.address
}

output "db_port" {
  description = "Port of the database"
  value       = aws_db_instance.main.port
}

output "db_endpoint" {
  description = "host:port endpoint of the database"
  value       = aws_db_instance.main.endpoint
}
