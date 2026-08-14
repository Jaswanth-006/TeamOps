# Root input variables. More are added as modules are built.

variable "region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1"
}
