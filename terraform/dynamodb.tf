# DynamoDB Tables configuration

resource "aws_dynamodb_table" "users" {
  name             = "BudgetPlanner-Users-${var.environment}"
  billing_mode     = var.dynamodb_billing_mode
  hash_key         = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Name = "Users Table"
  }
}

resource "aws_dynamodb_table" "plans" {
  name             = "BudgetPlanner-Plans-${var.environment}"
  billing_mode     = var.dynamodb_billing_mode
  hash_key         = "id"
  range_key        = null

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "KEYS_ONLY"
  }

  tags = {
    Name = "Plans Table"
  }
}

resource "aws_dynamodb_table" "budgets" {
  name             = "BudgetPlanner-Budgets-${var.environment}"
  billing_mode     = var.dynamodb_billing_mode
  hash_key         = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "KEYS_ONLY"
  }

  tags = {
    Name = "Budgets Table"
  }
}

resource "aws_dynamodb_table" "assets" {
  name             = "BudgetPlanner-Assets-${var.environment}"
  billing_mode     = var.dynamodb_billing_mode
  hash_key         = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "KEYS_ONLY"
  }

  tags = {
    Name = "Assets Table"
  }
}

resource "aws_dynamodb_table" "debts" {
  name             = "BudgetPlanner-Debts-${var.environment}"
  billing_mode     = var.dynamodb_billing_mode
  hash_key         = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIndex"
    hash_key        = "userId"
    projection_type = "KEYS_ONLY"
  }

  tags = {
    Name = "Debts Table"
  }
}

resource "aws_dynamodb_table" "user_versions" {
  name             = "BudgetPlanner-UserVersions-${var.environment}"
  billing_mode     = var.dynamodb_billing_mode
  hash_key         = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Name = "User Versions Table"
  }
}

# Per-user daily AI feedback counter (rows expire via TTL)
resource "aws_dynamodb_table" "ai_usage" {
  name         = "BudgetPlanner-AiUsage-${var.environment}"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "userId"
  range_key    = "day"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "day"
    type = "S"
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = {
    Name = "AI Usage Table"
  }
}
