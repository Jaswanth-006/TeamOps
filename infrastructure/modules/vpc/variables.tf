variable "environment" {
  description = "Environment name for tags and resource names"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDRs for the public subnets, one per AZ"
  type        = list(string)
}

variable "web_subnet_cidrs" {
  description = "CIDRs for the web-tier private subnets, one per AZ"
  type        = list(string)
}

variable "app_subnet_cidrs" {
  description = "CIDRs for the app-tier private subnets, one per AZ"
  type        = list(string)
}

variable "db_subnet_cidrs" {
  description = "CIDRs for the database private subnets, one per AZ"
  type        = list(string)
}
