#!/bin/bash

# Script to create DynamoDB tables for Budget Planner application
# Run this script after configuring your AWS credentials

echo "Creating DynamoDB tables for Budget Planner..."

# Table 1: Users
echo "Creating BudgetPlanner-Users table..."
aws dynamodb create-table \
    --table-name BudgetPlanner-Users \
    --attribute-definitions \
        AttributeName=Id,AttributeType=S \
    --key-schema \
        AttributeName=Id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --tags Key=Application,Value=BudgetPlanner

# Table 2: Assets
echo "Creating BudgetPlanner-Assets table..."
aws dynamodb create-table \
    --table-name BudgetPlanner-Assets \
    --attribute-definitions \
        AttributeName=Id,AttributeType=S \
        AttributeName=UserId,AttributeType=S \
    --key-schema \
        AttributeName=Id,KeyType=HASH \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"UserIndex\",
            \"KeySchema\": [
                {
                    \"AttributeName\": \"UserId\",
                    \"KeyType\": \"HASH\"
                }
            ],
            \"Projection\": {
                \"ProjectionType\": \"ALL\"
            }
        }]" \
    --billing-mode PAY_PER_REQUEST \
    --tags Key=Application,Value=BudgetPlanner

# Table 3: Debts
echo "Creating BudgetPlanner-Debts table..."
aws dynamodb create-table \
    --table-name BudgetPlanner-Debts \
    --attribute-definitions \
        AttributeName=Id,AttributeType=S \
        AttributeName=UserId,AttributeType=S \
    --key-schema \
        AttributeName=Id,KeyType=HASH \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"UserIndex\",
            \"KeySchema\": [
                {
                    \"AttributeName\": \"UserId\",
                    \"KeyType\": \"HASH\"
                }
            ],
            \"Projection\": {
                \"ProjectionType\": \"ALL\"
            }
        }]" \
    --billing-mode PAY_PER_REQUEST \
    --tags Key=Application,Value=BudgetPlanner

# Table 4: Budgets
echo "Creating BudgetPlanner-Budgets table..."
aws dynamodb create-table \
    --table-name BudgetPlanner-Budgets \
    --attribute-definitions \
        AttributeName=Id,AttributeType=S \
        AttributeName=UserId,AttributeType=S \
    --key-schema \
        AttributeName=Id,KeyType=HASH \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"UserIndex\",
            \"KeySchema\": [
                {
                    \"AttributeName\": \"UserId\",
                    \"KeyType\": \"HASH\"
                }
            ],
            \"Projection\": {
                \"ProjectionType\": \"ALL\"
            }
        }]" \
    --billing-mode PAY_PER_REQUEST \
    --tags Key=Application,Value=BudgetPlanner

# Table 5: Plans
echo "Creating BudgetPlanner-Plans table..."
aws dynamodb create-table \
    --table-name BudgetPlanner-Plans \
    --attribute-definitions \
        AttributeName=Id,AttributeType=S \
        AttributeName=UserId,AttributeType=S \
    --key-schema \
        AttributeName=Id,KeyType=HASH \
    --global-secondary-indexes \
        "[{
            \"IndexName\": \"UserIndex\",
            \"KeySchema\": [
                {
                    \"AttributeName\": \"UserId\",
                    \"KeyType\": \"HASH\"
                }
            ],
            \"Projection\": {
                \"ProjectionType\": \"ALL\"
            }
        }]" \
    --billing-mode PAY_PER_REQUEST \
    --tags Key=Application,Value=BudgetPlanner

echo "Waiting for tables to become active..."
aws dynamodb wait table-exists --table-name BudgetPlanner-Users
aws dynamodb wait table-exists --table-name BudgetPlanner-Assets
aws dynamodb wait table-exists --table-name BudgetPlanner-Debts
aws dynamodb wait table-exists --table-name BudgetPlanner-Budgets
aws dynamodb wait table-exists --table-name BudgetPlanner-Plans

echo "All tables created successfully!"
echo ""
echo "Table status:"
aws dynamodb describe-table --table-name BudgetPlanner-Users --query 'Table.TableStatus'
aws dynamodb describe-table --table-name BudgetPlanner-Assets --query 'Table.TableStatus'
aws dynamodb describe-table --table-name BudgetPlanner-Debts --query 'Table.TableStatus'
aws dynamodb describe-table --table-name BudgetPlanner-Budgets --query 'Table.TableStatus'
aws dynamodb describe-table --table-name BudgetPlanner-Plans --query 'Table.TableStatus'