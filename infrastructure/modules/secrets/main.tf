# Store the database connection details as a single encrypted secret. The app
# tier reads this at boot to build its DATABASE_URL, so the password never lives
# in code, config, or the launch template.
resource "aws_secretsmanager_secret" "db" {
  name = "teamops/db-credentials-${var.environment}"

  tags = {
    Name = "teamops-db-credentials-${var.environment}"
  }
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    host     = var.db_host
    port     = var.db_port
    dbname   = var.db_name
  })
}
