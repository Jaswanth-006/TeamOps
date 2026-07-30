variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "db_instance_class" {
  description = "The instance type of the RDS instance"
  type        = string
}

variable "db_engine" {
  description = "The database engine to use"
  type        = string
}

variable "db_engine_version" {
  description = "The engine version to use"
  type        = string
}

variable "db_parameter_group_name" {
  description = "Name of the parameter group to associate"
  type        = string
}

variable "storage_encrypted" {
  description = "Specifies whether the DB instance is encrypted"
  type        = bool
}

variable "db_allocated_storage" {
  description = "The allocated storage in gibibytes"
  type        = number
}

variable "db_storage_type" {
  description = "One of 'standard' (magnetic), 'gp2' (general purpose SSD), or 'io1' (provisioned IOPS SSD)"
  type        = string
}

variable "db_username" {
  description = "Username for the master DB user"
  type        = string
}

variable "db_password" {
  description = "Password for the master DB user"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the database"
  type        = string
}

variable "multi_az" {
  description = "Specifies if the RDS instance is multi-AZ"
  type        = bool
}

variable "publicly_accessible" {
  description = "Specifies if the RDS instance is publicly accessible"
  type        = bool
}

variable "backup_retention_period" {
  description = "The days to retain backups for"
  type        = number
}

variable "backup_window" {
  description = "The daily time range (in UTC) during which automated backups are created"
  type        = string
}

variable "maintenance_window" {
  description = "The window to perform maintenance in"
  type        = string
}

variable "skip_final_snapshot" {
  description = "Determines whether a final DB snapshot is created before the DB instance is deleted"
  type        = bool
}

variable "deletion_protection" {
  description = "If the DB instance should have deletion protection enabled"
  type        = bool

}

variable "apply_immediately" {
  description = "Specifies whether any database modifications are applied immediately, or during the next maintenance window"
  type        = bool

}

variable "performance_insights_enabled" {
  description = "Specifies whether Performance Insights are enabled"
  type        = bool

}

variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string

}

variable "alb_subnet_public" {
  description = "List of public subnets for Application Load Balancer"
  type        = list(string)
}

variable "web_subnet_private" {
  description = "List of private subnets for Web tier"
  type        = list(string)
}

variable "app_subnet_private" {
  description = "List of private subnets for App tier"
  type        = list(string)
}

variable "db_subnet_private" {
  description = "List of private subnets for Database tier"
  type        = list(string)
}

variable "web_instance_type" {
  description = "Instance type for Web tier"
  type        = string
}

variable "app_instance_type" {
  description = "Instance type for App tier"
  type        = string
}

variable "hosted_zone_name" {
  description = "The name of the hosted zone"
  type        = string
}

variable "record_name" {
  description = "The name of the record"
  type        = string
}

variable "desired_capacity_web" {
  description = "The desired capacity of the Auto Scaling Group"
  type        = number
}

variable "min_size_web" {
  description = "The minimum size of the Auto Scaling Group"
  type        = number
}

variable "max_size_web" {
  description = "The maximum size of the Auto Scaling Group"
  type        = number
}

variable "desired_capacity_app" {
  description = "The desired capacity of the Auto Scaling Group"
  type        = number
}

variable "min_size_app" {
  description = "The minimum size of the Auto Scaling Group"
  type        = number
}

variable "max_size_app" {
  description = "The maximum size of the Auto Scaling Group"
  type        = number
}

variable "bastion_image_id" {
  description = "AMI ID for the Bastion Host"
  type        = string
}

variable "bastion_instance_type" {
  description = "Instance type for the Bastion Host"
  type        = string
}

variable "bastion_tags" {
  description = "Tags to be applied to the Bastion Host"
  type        = map(string)
}

variable "bastion_key_name" {
  description = "Key pair name for the Bastion Host"
  type        = string
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
}

variable "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  type        = string
}

variable "secret_username" {
  description = "Username for the secret"
  type        = string
}

variable "secret_password" {
  description = "Password for the secret"
  type        = string
  sensitive   = true
}

variable "secret_db_name" {
  description = "Database name for the secret"
  type        = string
}
