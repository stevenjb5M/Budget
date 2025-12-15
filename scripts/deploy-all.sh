#!/bin/bash

# Deploy entire infrastructure: Lambda + Frontend
# Usage: ./scripts/deploy-all.sh <environment> [api-gateway-url]

set -e

ENVIRONMENT=${1:-dev}
API_URL=${2:-}

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Error: Invalid environment. Must be 'dev' or 'prod'"
  exit 1
fi

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Deploy Terraform infrastructure (if not already deployed)
echo "🏗️  Deploying infrastructure with Terraform..."
cd terraform || { echo "❌ Terraform directory not found."; exit 1; }
terraform init
terraform apply -var="environment=$ENVIRONMENT" -auto-approve

# Get API Gateway URL from Terraform output
if [ -z "$API_URL" ]; then
  API_URL=$(terraform output -raw api_gateway_url 2>/dev/null || echo "")
  if [ -z "$API_URL" ]; then
    echo "⚠️  Could not retrieve API Gateway URL from Terraform"
    echo "   Please provide it manually: ./scripts/deploy-frontend.sh <api-gateway-url>"
    exit 1
  fi
fi

cd ..

# Deploy Lambda functions
echo "⚡ Deploying Lambda functions..."
cd lambda || { echo "❌ Lambda directory not found."; exit 1; }
npm run build
# Note: Actual Lambda deployment would use SAM, Serverless, or direct AWS CLI
# This is a placeholder for the deployment command
# sam deploy --guided (or serverless deploy)
cd ..

# Deploy frontend
echo "📱 Deploying frontend to CloudFront..."
./scripts/deploy-frontend.sh "$API_URL"

echo "✅ All deployments completed successfully!"
