# Launch templates — the blueprints an Auto Scaling Group uses to create
# identical servers on demand. Each carries its tier's AMI, size, security group,
# key, and a boot (user-data) script rendered from a template.

# Web tier: nginx + React build. The internal ALB DNS is injected so nginx knows
# where to proxy /api.
resource "aws_launch_template" "web" {
  name_prefix   = "teamops-web-${var.environment}-"
  image_id      = var.web_ami_id
  instance_type = var.web_instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [var.web_sg_id]

  user_data = base64encode(templatefile("${path.module}/user_data/web.sh.tftpl", {
    internal_alb_dns = var.internal_alb_dns_name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "teamops-web-${var.environment}"
      Tier = "web"
    }
  }
}

# App tier: Express API. Carries the instance profile so it can read the DB
# secret, and receives the secret name + region via user data.
resource "aws_launch_template" "app" {
  name_prefix   = "teamops-app-${var.environment}-"
  image_id      = var.app_ami_id
  instance_type = var.app_instance_type
  key_name      = var.key_name

  vpc_security_group_ids = [var.app_sg_id]

  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }

  user_data = base64encode(templatefile("${path.module}/user_data/app.sh.tftpl", {
    region      = var.region
    secret_name = var.secret_name
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "teamops-app-${var.environment}"
      Tier = "app"
    }
  }
}
