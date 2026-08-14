output "secret_arn" {
  description = "ARN of the DB credentials secret (used to scope IAM access)"
  value       = aws_secretsmanager_secret.db.arn
}

output "secret_name" {
  description = "Name of the DB credentials secret (used by the app to fetch it)"
  value       = aws_secretsmanager_secret.db.name
}
