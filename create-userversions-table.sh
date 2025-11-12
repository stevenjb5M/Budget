#!/bin/bash

# Script to create BudgetPlanner-UserVersions DynamoDB table
# This table tracks version history for users

echo "Creating BudgetPlanner-UserVersions table..."
aws dynamodb create-table \
    --table-name BudgetPlanner-UserVersions \
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

echo "Waiting for table to become active..."
aws dynamodb wait table-exists --table-name BudgetPlanner-UserVersions

echo "BudgetPlanner-UserVersions table created successfully!"
echo ""
echo "Table status:"
aws dynamodb describe-table --table-name BudgetPlanner-UserVersions --query 'Table.TableStatus'
