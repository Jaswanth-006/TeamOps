variable "hosted_zone_name" {
  description = "Name of the existing hosted zone"
  type        = string
}

variable "record_name" {
  description = "Name of the record record (e.g. dev)"
  type        = string
}

variable "alb_dns_name" {
  description = "DNS name of the ALB"
  type        = string
}

variable "alb_zone_id" {
  description = "Zone ID of the ALB"
  type        = string
}
