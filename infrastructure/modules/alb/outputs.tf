output "public_alb_dns_name" {
  description = "Public DNS name of the internet-facing ALB"
  value       = aws_lb.public.dns_name
}

output "public_alb_zone_id" {
  description = "Hosted zone id of the public ALB (for Route 53 alias records)"
  value       = aws_lb.public.zone_id
}

output "public_alb_arn" {
  value = aws_lb.public.arn
}

output "web_target_group_arn" {
  value = aws_lb_target_group.web.arn
}
