resource "aws_alb" "alb_web" {
  name               = "alb-web"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnets

  enable_deletion_protection = false
  idle_timeout               = 60

  tags = {
    Name = "alb_web_${terraform.workspace}"
  }
}

resource "aws_lb_target_group" "alb_target_group_web" {
  name     = "alb-target-group-web"
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
    Name = "alb_target_group_web_${terraform.workspace}"
  }
}

resource "aws_lb_listener" "alb_listener_web" {
  load_balancer_arn = aws_alb.alb_web.id
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group_web.id
  }
}


resource "aws_lb_listener" "alb_listener_web_ssl" {
  load_balancer_arn = aws_alb.alb_web.id
  port              = 443
  protocol          = "HTTPS"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.alb_target_group_web.id
  }
}

