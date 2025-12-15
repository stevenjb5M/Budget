#!/bin/bash

# Deploy frontend to S3 and invalidate CloudFront
# Usage: ./scripts/deploy-frontend.sh <api-gateway-url>

set -e

if [ -z "$1" ]; then
  echo "Error: API Gateway URL is required"
  echo "Usage: ./scripts/deploy-frontend.sh <api-gateway-url>"
  exit 1
fi

API_URL="$1"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

echo "🏗️  Building frontend..."
API_URL="$API_URL" npm run build:prod

echo "📦 Syncing to S3..."
aws s3 sync frontend/dist s3://${AWS_BUCKET_NAME} \
  --delete \
  --exclude "*" \
  --include "*.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --region ${AWS_REGION}

aws s3 sync frontend/dist s3://${AWS_BUCKET_NAME} \
  --delete \
  --exclude "*.html" \
  --cache-control "public, max-age=31536000, immutable" \
  --region ${AWS_REGION}

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id ${AWS_CLOUDFRONT_DIST_ID} \
  --paths "/*" \
  --region ${AWS_REGION}

echo "✅ Frontend deployed successfully!"
echo "CloudFront URL: https://$(aws cloudfront get-distribution --id ${AWS_CLOUDFRONT_DIST_ID} --query 'Distribution.DomainName' --output text)"
