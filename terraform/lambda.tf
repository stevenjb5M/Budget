# Lambda IAM Role and Policy

resource "aws_iam_role" "lambda_role" {
  name = "BudgetPlanner-Lambda-Role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Allow Lambda to write to CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Allow Lambda to access DynamoDB
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "BudgetPlanner-Lambda-DynamoDB-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.plans.arn,
          aws_dynamodb_table.budgets.arn,
          aws_dynamodb_table.assets.arn,
          aws_dynamodb_table.debts.arn,
          aws_dynamodb_table.user_versions.arn,
          "${aws_dynamodb_table.plans.arn}/index/*",
          "${aws_dynamodb_table.budgets.arn}/index/*",
          "${aws_dynamodb_table.assets.arn}/index/*",
          "${aws_dynamodb_table.debts.arn}/index/*"
        ]
      }
    ]
  })
}

# Allow Lambda to invoke Bedrock API
resource "aws_iam_role_policy" "lambda_bedrock" {
  name = "BudgetPlanner-Lambda-Bedrock-${var.environment}"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"
      }
    ]
  })
}

# Lambda functions for each endpoint

resource "aws_lambda_function" "users" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Users-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/users-handler.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      USERS_TABLE        = aws_dynamodb_table.users.name
      ENVIRONMENT        = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_dynamodb]
}

resource "aws_lambda_function" "plans" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Plans-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/plans-handler.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      PLANS_TABLE        = aws_dynamodb_table.plans.name
      ENVIRONMENT        = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_dynamodb]
}

resource "aws_lambda_function" "budgets" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Budgets-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/budgets-handler.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      BUDGETS_TABLE      = aws_dynamodb_table.budgets.name
      ENVIRONMENT        = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_dynamodb]
}

resource "aws_lambda_function" "assets" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Assets-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/assets-handler.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      ASSETS_TABLE       = aws_dynamodb_table.assets.name
      ENVIRONMENT        = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_dynamodb]
}

resource "aws_lambda_function" "debts" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Debts-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/debts-handler.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      DEBTS_TABLE        = aws_dynamodb_table.debts.name
      ENVIRONMENT        = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_dynamodb]
}

resource "aws_lambda_function" "bedrock" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Bedrock-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "dist/bedrock-handler.handler"
  runtime       = "nodejs20.x"
  architectures = ["arm64"]
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      AWS_REGION         = var.aws_region
      ENVIRONMENT        = var.environment
    }
  }

  depends_on = [aws_iam_role_policy.lambda_bedrock]
}
