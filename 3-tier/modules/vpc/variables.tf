variable "cidr_block" {
  type = string
}

variable "tags" {
  type = map(string)
}

variable "alb_subnet_public" {
  type = list(string)
}

variable "web_subnet_private" {
  type = list(string)
}

variable "app_subnet_private" {
  type = list(string)
}

variable "db_subnet_private" {
  type = list(string)
}
