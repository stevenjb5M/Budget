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
