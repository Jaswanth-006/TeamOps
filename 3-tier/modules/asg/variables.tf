variable "vpc_id" {
  type = string
}

variable "public_subnets" {
  type = list(string)
}

variable "web_private_subnets" {
  type = list(string)
}

variable "app_private_subnets" {
  type = list(string)
}

variable "frontend_alb_sg_id" {
  type = string
}

variable "backend_alb_sg_id" {
  type = string
}

variable "web_instance_type" {
  type = string
}

variable "app_instance_type" {
  type = string
}

variable "web_image_id" {
  type = string
}

variable "app_image_id" {
  type = string
}

variable "web_user_data_base64" {
  type = string
}

variable "app_user_data_base64" {
  type = string
}

variable "sns_topic_arn" {
  type = string
}

variable "secret_arn" {
  type = string
}

variable "desired_capacity_web" {
  type = number
}

variable "min_size_web" {
  type = number
}

variable "max_size_web" {
  type = number
}

variable "desired_capacity_app" {
  type = number
}

variable "min_size_app" {
  type = number
}

variable "max_size_app" {
  type = number
}

variable "web_sg_id" {
  type = string
}

variable "app_sg_id" {
  type = string
}

variable "key_name" {
  type = string
}

variable "certificate_arn" {
  type = string
}
