resource "aws_autoscaling_notification" "web_notifications" {
  group_names = [
    aws_autoscaling_group.web.name,
    aws_autoscaling_group.app.name,
  ]

  notifications = [
    "autoscaling:EC2_INSTANCE_LAUNCH",
    "autoscaling:EC2_INSTANCE_TERMINATE",
    "autoscaling:EC2_INSTANCE_LAUNCH_ERROR",
    "autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
  ]

  topic_arn = var.sns_topic_arn
}
