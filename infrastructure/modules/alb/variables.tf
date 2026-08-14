variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "public_subnet_ids" {
  description = "Public subnets for the internet-facing ALB"
  type        = list(string)
}

variable "app_subnet_ids" {
  description = "App-tier private subnets for the internal ALB"
  type        = list(string)
}

variable "public_alb_sg_id" {
  type = string
}

variable "internal_alb_sg_id" {
  type = string
}
