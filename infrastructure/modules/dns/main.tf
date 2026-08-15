# Look up the existing hosted zone for the domain.
data "aws_route53_zone" "main" {
  name         = var.hosted_zone_name
  private_zone = false
}

locals {
  fqdn = "${var.record_name}.${var.hosted_zone_name}"
}

# ACM certificate for the site's fully qualified domain name, validated via DNS.
resource "aws_acm_certificate" "main" {
  domain_name       = local.fqdn
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Create the DNS records ACM needs to prove we own the domain.
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.record]
  ttl     = 60
}

# Wait for validation to complete before using the certificate.
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# HTTPS listener on the public ALB. TLS terminates here; traffic inside the VPC
# is plain HTTP.
resource "aws_lb_listener" "https" {
  load_balancer_arn = var.public_alb_arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = var.web_target_group_arn
  }
}

# Point the subdomain at the public ALB with an alias record.
resource "aws_route53_record" "site" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.fqdn
  type    = "A"

  alias {
    name                   = var.public_alb_dns_name
    zone_id                = var.public_alb_zone_id
    evaluate_target_health = true
  }
}
