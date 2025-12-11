# API Gateway configuration

resource "aws_apigateway_rest_api" "api" {
  name        = "BudgetPlanner-API-${var.environment}"
  description = "Budget Planner REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

# Users endpoint
resource "aws_apigateway_resource" "users" {
  rest_api_id = aws_apigateway_rest_api.api.id
  parent_id   = aws_apigateway_rest_api.api.root_resource_id
  path_part   = "users"
}

# Lambda permission for users function
resource "aws_lambda_permission" "users_api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigateway_rest_api.api.execution_arn}/*/*"
}

# Method for users endpoint
resource "aws_apigateway_method" "users_get" {
  rest_api_id      = aws_apigateway_rest_api.api.id
  resource_id      = aws_apigateway_resource.users.id
  http_method      = "GET"
  authorization    = "COGNITO_USER_POOLS"
  authorizer_id    = aws_apigateway_authorizer.cognito.id
}

# Integration for users endpoint
resource "aws_apigateway_integration" "users_integration" {
  rest_api_id      = aws_apigateway_rest_api.api.id
  resource_id      = aws_apigateway_resource.users.id
  http_method      = aws_apigateway_method.users_get.http_method
  type             = "AWS_PROXY"
  integration_http_method = "POST"
  uri              = aws_lambda_function.users.invoke_arn
}

# Cognito Authorizer
resource "aws_apigateway_authorizer" "cognito" {
  name            = "CognitoAuthorizer"
  rest_api_id     = aws_apigateway_rest_api.api.id
  identity_source = "method.request.header.Authorization"
  type            = "COGNITO_USER_POOLS"

  provider_arns = [
    "arn:aws:cognito-idp:${var.aws_region}:YOUR_ACCOUNT_ID:userpool/YOUR_POOL_ID"
  ]
}

# API deployment
resource "aws_apigateway_deployment" "api" {
  rest_api_id = aws_apigateway_rest_api.api.id

  depends_on = [
    aws_apigateway_integration.users_integration
  ]
}

# API stage
resource "aws_apigateway_stage" "prod" {
  deployment_id = aws_apigateway_deployment.api.id
  rest_api_id   = aws_apigateway_rest_api.api.id
  stage_name    = "prod"

  variables = {
    environment = var.environment
  }
}
