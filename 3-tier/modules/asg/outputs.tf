output "web_alb_dns_name" {
  description = "DNS name of the Web Application Load Balancer"
  value       = aws_lb.web_alb.dns_name
}

output "app_alb_dns_name" {
  description = "DNS name of the App Application Load Balancer"
  value       = aws_lb.app_alb.dns_name
}

output "web_alb_zone_id" {
  description = "Zone ID of the Web Application Load Balancer"
  value       = aws_lb.web_alb.zone_id
}


