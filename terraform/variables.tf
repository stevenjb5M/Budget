# Input variables for Terraform configuration

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "cloudfront_domain" {
  description = "CloudFront domain for CORS"
  type        = string
  default     = "https://dbwgrrx6epya7.cloudfront.net"
}

variable "allowed_local_origins" {
  description = "Additional local origins allowed for development (comma-separated, for dev environment only)"
  type        = string
  default     = "http://localhost:5173"
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 128

  validation {
    condition     = var.lambda_memory >= 128 && var.lambda_memory <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB."
  }
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "frontend_domain" {
  description = "Frontend domain name"
  type        = string
  default     = "budgetplanner.dev"
}

variable "enable_cors" {
  description = "Enable CORS for API Gateway"
  type        = bool
  default     = true
}

variable "ai_daily_limit" {
  description = "Max AI budget feedback requests per user per UTC day"
  type        = number
  default     = 20
}

variable "api_throttle_rate_limit" {
  description = "Steady-state requests per second allowed across the whole API"
  type        = number
  default     = 20
}

variable "api_throttle_burst_limit" {
  description = "Burst requests allowed across the whole API"
  type        = number
  default     = 40
}

variable "ai_throttle_rate_limit" {
  description = "Steady-state requests per second allowed on POST /api/bedrock/feedback"
  type        = number
  default     = 1
}

variable "ai_throttle_burst_limit" {
  description = "Burst requests allowed on POST /api/bedrock/feedback"
  type        = number
  default     = 3
}
