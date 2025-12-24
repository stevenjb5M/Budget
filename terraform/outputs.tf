# Output values from Terraform configuration

output "api_gateway_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    users        = aws_dynamodb_table.users.name
    plans        = aws_dynamodb_table.plans.name
    budgets      = aws_dynamodb_table.budgets.name
    assets       = aws_dynamodb_table.assets.name
    debts        = aws_dynamodb_table.debts.name
    user_versions = aws_dynamodb_table.user_versions.name
  }
}

output "lambda_functions" {
  description = "Lambda function names"
  value = {
    users  = aws_lambda_function.users.function_name
    plans  = aws_lambda_function.plans.function_name
    budgets = aws_lambda_function.budgets.function_name
    assets = aws_lambda_function.assets.function_name
    debts  = aws_lambda_function.debts.function_name
  }
}

output "environment_variables" {
  description = "Environment variables for frontend"
  value = {
    VITE_API_URL            = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
    VITE_USER_POOL_ID       = aws_cognito_user_pool.main.id
    VITE_USER_POOL_CLIENT_ID = aws_cognito_user_pool_client.frontend.id
  }
  sensitive = false
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.frontend.id
}

output "cognito_domain" {
  description = "Cognito domain for hosted UI"
  value       = aws_cognito_user_pool_domain.main.domain
}
