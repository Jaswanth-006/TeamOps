# Public, internet-facing load balancer — the site's front door. Lives in the
# public subnets and spreads traffic across the web tier.
resource "aws_lb" "public" {
  name               = "teamops-public-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.public_alb_sg_id]
  subnets            = var.public_subnet_ids

  tags = {
    Name = "teamops-public-alb-${var.environment}"
  }
}

# Target group for the web tier. The health check hits "/" — the ALB only sends
# traffic to instances that return healthy, and removes ones that don't.
resource "aws_lb_target_group" "web" {
  name     = "teamops-web-tg-${var.environment}"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path                = "/"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "teamops-web-tg-${var.environment}"
  }
}

# HTTP listener: forward incoming web traffic to the web target group.
# (HTTPS is added later, in the DNS/TLS module.)
resource "aws_lb_listener" "public_http" {
  load_balancer_arn = aws_lb.public.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}
