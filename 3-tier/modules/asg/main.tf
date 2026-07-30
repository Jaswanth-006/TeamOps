# web application load balancer
resource "aws_lb" "web_alb" {
  name               = "web-alb"
  internal           = false
  load_balancer_type = "application"

  security_groups = [var.frontend_alb_sg_id]
  subnets         = var.public_subnets

  enable_deletion_protection = false
  idle_timeout               = 60

  tags = {
    Name        = "web_alb_${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "frontend"
  }
}

resource "aws_lb_target_group" "web" {
  name     = "web"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2

  }

  tags = {
    Name        = "web_tg_${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "frontend"
  }
}


resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.web_alb.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.id
  }

}

resource "aws_lb_listener" "web_https" {
  load_balancer_arn = aws_lb.web_alb.id
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.id
  }
}
# web launch template
resource "aws_launch_template" "web" {
  name_prefix = "${terraform.workspace}_web"

  image_id      = var.web_image_id
  instance_type = var.web_instance_type

  vpc_security_group_ids = [var.web_sg_id]
  key_name               = var.key_name

  user_data = base64encode(replace(base64decode(var.web_user_data_base64), "__APP_ALB_DNS__", aws_lb.app_alb.dns_name))

  monitoring {
    enabled = true
  }


  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "web_${terraform.workspace}"
      Environment = "${terraform.workspace}"
      Project     = "vpc-alb"
      Tier        = "frontend"
    }
  }

}


resource "aws_autoscaling_group" "web" {
  name_prefix = "${terraform.workspace}_web"

  vpc_zone_identifier = var.web_private_subnets
  default_cooldown    = 60


  desired_capacity = var.desired_capacity_web
  min_size         = var.min_size_web
  max_size         = var.max_size_web

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  target_group_arns = [aws_lb_target_group.web.id]

  tag {
    key                 = "Name"
    value               = "web_${terraform.workspace}"
    propagate_at_launch = true
  }

}


# App ALB (Internal)

resource "aws_lb" "app_alb" {
  name               = "app-alb"
  internal           = true
  load_balancer_type = "application"

  security_groups = [var.backend_alb_sg_id]
  subnets         = var.public_subnets

  enable_deletion_protection = false
  idle_timeout               = 60

  tags = {
    Name        = "app_alb_${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "backend"
  }
}


resource "aws_lb_target_group" "app" {
  name     = "app"
  port     = 4000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2

  }

  tags = {
    Name        = "app_tg_${terraform.workspace}"
    Environment = "${terraform.workspace}"
    Project     = "vpc-alb"
    Tier        = "backend"
  }
}


resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app_alb.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.id
  }

}

# app launch template and asg

# App IAM Role
resource "aws_iam_role" "app_role" {
  name = "app_role_${terraform.workspace}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "secrets_policy" {
  name        = "secrets_policy_${terraform.workspace}"
  description = "Allow access to secrets manager"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "secrets_attach" {
  role       = aws_iam_role.app_role.name
  policy_arn = aws_iam_policy.secrets_policy.arn
}

resource "aws_iam_instance_profile" "app_profile" {
  name = "app_profile_${terraform.workspace}"
  role = aws_iam_role.app_role.name
}

resource "aws_launch_template" "app" {
  name_prefix = "${terraform.workspace}_app"

  image_id      = var.app_image_id
  instance_type = var.app_instance_type

  vpc_security_group_ids = [var.app_sg_id]
  key_name               = var.key_name

  user_data = var.app_user_data_base64

  monitoring {
    enabled = true
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.app_profile.name
  }



  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "app_${terraform.workspace}"
      Environment = "${terraform.workspace}"
      Project     = "vpc-alb"
      Tier        = "backend"
    }
  }



}

resource "aws_autoscaling_group" "app" {
  name_prefix = "${terraform.workspace}_app"

  vpc_zone_identifier = var.app_private_subnets
  default_cooldown    = 60

  desired_capacity = var.desired_capacity_app
  min_size         = var.min_size_app
  max_size         = var.max_size_app

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  target_group_arns = [aws_lb_target_group.app.id]

  tag {
    key                 = "Name"
    value               = "app_${terraform.workspace}"
    propagate_at_launch = true
  }

}
