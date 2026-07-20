provider "aws" { region = var.aws_region; default_tags { tags = { Product = "Autoserve"; Environment = var.environment; ManagedBy = "Terraform" } } }

module "foundation" {
  source = "./modules/foundation"
  environment = var.environment
}
