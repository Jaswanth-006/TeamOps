# Auto Scaling Groups — keep a target number of identical servers running across
# the AZs, register them with the load balancer, and replace any that fail. This
# is the self-healing layer: terminate an instance and the ASG builds a new one.

resource "aws_autoscaling_group" "web" {
  name_prefix         = "teamops-web-${var.environment}-"
  vpc_zone_identifier = var.web_subnet_ids
  target_group_arns   = [var.web_target_group_arn]
  health_check_type   = "ELB"

  desired_capacity = var.web_desired_capacity
  min_size         = var.web_min_size
  max_size         = var.web_max_size

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  # Roll instances gradually when the launch template changes, keeping the
  # service available during the swap.
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "teamops-web-${var.environment}"
    propagate_at_launch = true
  }
}

resource "aws_autoscaling_group" "app" {
  name_prefix         = "teamops-app-${var.environment}-"
  vpc_zone_identifier = var.app_subnet_ids
  target_group_arns   = [var.app_target_group_arn]
  health_check_type   = "ELB"

  desired_capacity = var.app_desired_capacity
  min_size         = var.app_min_size
  max_size         = var.app_max_size

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

  tag {
    key                 = "Name"
    value               = "teamops-app-${var.environment}"
    propagate_at_launch = true
  }
}
