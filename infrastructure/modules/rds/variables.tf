variable "environment" {
  type = string
}

variable "db_subnet_ids" {
  description = "Private subnet ids the database lives in (needs >= 2 AZs)"
  type        = list(string)
}

variable "db_security_group_id" {
  description = "Security group controlling access to the database"
  type        = string
}

variable "instance_class" {
  type = string
}

variable "engine_version" {
  type = string
}

variable "allocated_storage" {
  type = number
}

variable "multi_az" {
  type = bool
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_name" {
  type = string
}
