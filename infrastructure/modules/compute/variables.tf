variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "web_subnet_ids" {
  description = "Web-tier private subnets for the web ASG"
  type        = list(string)
}

variable "app_subnet_ids" {
  description = "App-tier private subnets for the app ASG"
  type        = list(string)
}

variable "web_sg_id" {
  type = string
}

variable "app_sg_id" {
  type = string
}

variable "web_target_group_arn" {
  type = string
}

variable "app_target_group_arn" {
  type = string
}

variable "web_ami_id" {
  description = "AMI for the web tier"
  type        = string
}

variable "app_ami_id" {
  description = "AMI for the app tier"
  type        = string
}

variable "web_instance_type" {
  type = string
}

variable "app_instance_type" {
  type = string
}

variable "key_name" {
  type = string
}

variable "secret_arn" {
  description = "ARN of the DB credentials secret the app tier may read"
  type        = string
}

variable "secret_name" {
  description = "Name of the DB credentials secret, passed to the app at boot"
  type        = string
}

variable "internal_alb_dns_name" {
  description = "Internal ALB DNS name, injected into the web tier's nginx config"
  type        = string
}

variable "region" {
  type = string
}

variable "web_desired_capacity" {
  type = number
}

variable "web_min_size" {
  type = number
}

variable "web_max_size" {
  type = number
}

variable "app_desired_capacity" {
  type = number
}

variable "app_min_size" {
  type = number
}

variable "app_max_size" {
  type = number
}
