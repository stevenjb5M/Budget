# Terraform configuration for Budget Planner
# This demonstrates Terraform's cleaner syntax and modularity

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment this to use S3 for state management
  # backend "s3" {
  #   bucket         = "budget-planner-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "BudgetPlanner"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
