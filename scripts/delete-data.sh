#!/bin/bash

# Script to delete all data from DynamoDB tables for Budget Planner application
# This script keeps the tables but removes all items
# Run this script after configuring your AWS credentials

echo "Deleting all data from DynamoDB tables for Budget Planner..."

# Function to delete all items from a table
delete_table_data() {
    local TABLE=$1
    local KEY_ATTR=$2

    echo "Checking if table $TABLE exists..."
    if aws dynamodb describe-table --table-name "$TABLE" &>/dev/null; then
        echo "Deleting all items from $TABLE..."

        # Get all item keys
        KEYS=$(aws dynamodb scan --table-name "$TABLE" --query "Items[*].{key: $KEY_ATTR.S}" --output json)

        if [ "$KEYS" != "[]" ] && [ -n "$KEYS" ]; then
            # Parse the keys and delete each item
            echo "$KEYS" | jq -c '.[]' | while read -r key; do
                ITEM_KEY=$(echo "$key" | jq -r '.key')
                if [ -n "$ITEM_KEY" ]; then
                    aws dynamodb delete-item --table-name "$TABLE" --key "{\"$KEY_ATTR\": {\"S\": \"$ITEM_KEY\"}}"
                fi
            done
            echo "All items deleted from $TABLE."
        else
            echo "No items to delete in $TABLE."
        fi
    else
        echo "Table $TABLE does not exist, skipping..."
    fi
}

# Delete data from each table (specify table name and key attribute)
delete_table_data "BudgetPlanner-Users" "Id"
delete_table_data "BudgetPlanner-Assets" "Id"
delete_table_data "BudgetPlanner-Debts" "Id"
delete_table_data "BudgetPlanner-Budgets" "Id"
delete_table_data "BudgetPlanner-Plans" "Id"
delete_table_data "BudgetPlanner-UserVersions" "UserId"

echo "Data deletion completed!"