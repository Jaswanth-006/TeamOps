# Internal load balancer — internal = true means it has no public address and
# can only be reached from inside the VPC (specifically, from the web tier). This
# is what lets the app tier stay private while still being load-balanced.
resource "aws_lb" "internal" {
  name               = "teamops-internal-alb-${var.environment}"
  internal           = true
  load_balancer_type = "application"
  security_groups    = [var.internal_alb_sg_id]
  subnets            = var.app_subnet_ids

  tags = {
    Name = "teamops-internal-alb-${var.environment}"
  }
}

# Target group for the app tier on port 4000. Health check hits /health — the
# lightweight endpoint the backend exposes for exactly this purpose.
resource "aws_lb_target_group" "app" {
  name     = "teamops-app-tg-${var.environment}"
  port     = 4000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "teamops-app-tg-${var.environment}"
  }
}

# HTTP listener on port 80: nginx on the web tier proxies /api traffic here, and
# this forwards it to the app tier on 4000.
resource "aws_lb_listener" "internal_http" {
  load_balancer_arn = aws_lb.internal.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}
