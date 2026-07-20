variable "environment" { type = string; validation { condition = contains(["development", "staging", "production"], var.environment); error_message = "Environment must be development, staging, or production." } }
variable "aws_region" { type = string; default = "ap-south-1" }
variable "artifact_image" { type = string; description = "Immutable image digest promoted by the deployment pipeline." }
