
resource "aws_lb" "alb_app" {
  name               = "alb-app"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [var.app_sg_id]
  subnets            = var.app_subnets

  enable_deletion_protection = false
  idle_timeout               = 60

  tags = {
    Name = "alb_app_${terraform.workspace}"
  }
}

resource "aws_lb_target_group" "alb_target_group_app" {
  name     = "alb-target-group-app"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    port                = "80"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
    interval            = 30
    matcher             = "200"
  }

  tags = {
    Name = "alb_target_group_app_${terraform.workspace}"
  }
}

resource "aws_lb_listener" "alb_listener_app" {
  load_balancer_arn = aws_lb.alb_app.id
  port              = 4000
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group_app.id
  }
}
