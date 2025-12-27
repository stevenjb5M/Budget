# Cognito User Pool configuration

resource "aws_cognito_user_pool" "main" {
  name = "BudgetPlanner-${var.environment}"

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"

  tags = {
    Name = "Budget Planner User Pool"
  }
}

# User Pool Client for the frontend
resource "aws_cognito_user_pool_client" "frontend" {
  name            = "BudgetPlanner-Frontend-${var.environment}"
  user_pool_id    = aws_cognito_user_pool.main.id
  generate_secret = false

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["http://localhost:3000", "http://localhost:5173", "https://${aws_cloudfront_distribution.frontend.domain_name}"]
  logout_urls                          = ["http://localhost:3000", "http://localhost:5173", "https://${aws_cloudfront_distribution.frontend.domain_name}"]

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  depends_on = [aws_cognito_user_pool.main]
}

# Cognito Domain (optional but recommended for hosted UI)
# resource "aws_cognito_user_pool_domain" "main" {
#   domain       = "budget-planner-${var.environment}-${data.aws_caller_identity.current.account_id}"
#   user_pool_id = aws_cognito_user_pool.main.id
# }

# Data source to get current AWS account ID
data "aws_caller_identity" "current" {}
