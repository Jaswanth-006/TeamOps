variable "hosted_zone_name" {
  description = "Existing Route 53 hosted zone (e.g. example.com)"
  type        = string
}

variable "record_name" {
  description = "Subdomain to create (e.g. teamops)"
  type        = string
}

variable "public_alb_arn" {
  description = "ARN of the public ALB to attach the HTTPS listener to"
  type        = string
}

variable "public_alb_dns_name" {
  description = "DNS name of the public ALB (for the alias record)"
  type        = string
}

variable "public_alb_zone_id" {
  description = "Hosted zone id of the public ALB (for the alias record)"
  type        = string
}

variable "web_target_group_arn" {
  description = "Web target group the HTTPS listener forwards to"
  type        = string
}
