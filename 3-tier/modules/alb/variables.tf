variable "vpc_id" {
  description = "VPC ID where the ALB will be deployed"
  type        = string
}

variable "public_subnets" {
  description = "List of public subnet IDs for the ALB"
  type        = list(string)
}

variable "alb_sg_id" {
  description = "Security Group ID for the ALB"
  type        = string
}

variable "app_subnets" {
  description = "List of private subnet IDs for the App ALB"
  type        = list(string)
}

variable "app_sg_id" {
  description = "Security Group ID for the App ALB"
  type        = string
}
