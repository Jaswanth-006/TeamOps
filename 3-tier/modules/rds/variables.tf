variable "instance_class" {
  type = string
}

variable "engine" {
  type = string
}

variable "engine_version" {
  type = string
}

variable "parameter_group_name" {
  type = string
}

variable "storage_encrypted" {
  type = bool
}

variable "allocated_storage" {
  type = number
}

variable "storage_type" {
  type = string
}

variable "username" {
  type = string
}

variable "password" {
  type = string
}

variable "vpc_security_group_ids" {
  type = list(string)
}

variable "subnet_ids" {
  type = list(string)
}

variable "multi_az" {
  type = bool
}

variable "publicly_accessible" {
  type = bool
}

variable "backup_retention_period" {
  type = number
}

variable "backup_window" {
  type = string
}

variable "maintenance_window" {
  type = string
}

variable "skip_final_snapshot" {
  type = bool
}

variable "deletion_protection" {
  type = bool
}

variable "apply_immediately" {
  type = bool
}

variable "performance_insights_enabled" {
  type = bool
}
