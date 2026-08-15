# Target-tracking scaling policies. AWS adds or removes instances automatically
# to keep average CPU near the target — scale out under load, scale in when quiet,
# no manual intervention. This is the "elastic" in elastic compute.

resource "aws_autoscaling_policy" "web_cpu" {
  name                   = "teamops-web-cpu-${var.environment}"
  autoscaling_group_name = aws_autoscaling_group.web.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}

resource "aws_autoscaling_policy" "app_cpu" {
  name                   = "teamops-app-cpu-${var.environment}"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0
  }
}
