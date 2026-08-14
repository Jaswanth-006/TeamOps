# Root input variables for the whole infrastructure.

variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment name, used in resource names and tags"
  type        = string
  default     = "dev"
}

# ---------------------------------------------------------------------------
# Networking
# ---------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "CIDRs for the public subnets (ALB, bastion, NAT), one per AZ"
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

# ---------------------------------------------------------------------------
# Compute / instances
# ---------------------------------------------------------------------------

variable "web_instance_type" {
  description = "Instance type for the web tier"
  type        = string
  default     = "t3.small"
}

variable "app_instance_type" {
  description = "Instance type for the app tier"
  type        = string
  default     = "t3.small"
}

variable "bastion_instance_type" {
  description = "Instance type for the bastion host"
  type        = string
  default     = "t3.micro"
}

variable "key_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH to the bastion (ideally your IP, not 0.0.0.0/0)"
  type        = string
}

# ---------------------------------------------------------------------------
# Auto Scaling capacities
# ---------------------------------------------------------------------------

variable "web_desired_capacity" {
  type    = number
  default = 2
}

variable "web_min_size" {
  type    = number
  default = 1
}

variable "web_max_size" {
  type    = number
  default = 3
}

variable "app_desired_capacity" {
  type    = number
  default = 2
}

variable "app_min_size" {
  type    = number
  default = 2
}

variable "app_max_size" {
  type    = number
  default = 4
}

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------

variable "db_instance_class" {
  type    = string
  default = "db.t3.small"
}

variable "db_engine_version" {
  type    = string
  default = "16"
}

variable "db_allocated_storage" {
  type    = number
  default = 20
}

variable "db_multi_az" {
  type    = bool
  default = true
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
}

variable "db_password" {
  description = "Master password for the database"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Initial database name"
  type        = string
  default     = "teamops"
}

# ---------------------------------------------------------------------------
# DNS / TLS
# ---------------------------------------------------------------------------

variable "hosted_zone_name" {
  description = "Route 53 hosted zone (e.g. example.com)"
  type        = string
}

variable "record_name" {
  description = "Subdomain record to create (e.g. teamops)"
  type        = string
  default     = "teamops"
}
