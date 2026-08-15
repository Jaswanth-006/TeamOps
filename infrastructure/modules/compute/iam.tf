# IAM for the app tier. The app servers need to read the database secret at boot,
# but we never put AWS keys on a server. Instead the instances assume a role that
# grants exactly that permission — and nothing more.

# Trust policy: allow EC2 instances to assume this role.
data "aws_iam_policy_document" "app_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "app" {
  name               = "teamops-app-role-${var.environment}"
  assume_role_policy = data.aws_iam_policy_document.app_assume.json
}

# Permission policy: read ONLY the one DB secret (least privilege — not "*").
data "aws_iam_policy_document" "app_secrets" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.secret_arn]
  }
}

resource "aws_iam_role_policy" "app_secrets" {
  name   = "teamops-app-secrets-${var.environment}"
  role   = aws_iam_role.app.id
  policy = data.aws_iam_policy_document.app_secrets.json
}

# Instance profile — the wrapper that attaches the role to EC2 instances.
resource "aws_iam_instance_profile" "app" {
  name = "teamops-app-profile-${var.environment}"
  role = aws_iam_role.app.name
}
