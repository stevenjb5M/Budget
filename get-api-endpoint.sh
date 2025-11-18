#!/bin/bash

# Get Elastic Beanstalk API endpoint
echo "Fetching Elastic Beanstalk endpoint..."
API_CNAME=$(aws elasticbeanstalk describe-environments --environment-names budget-api-prod --region us-east-1 --query 'Environments[0].CNAME' --output text)

if [ -z "$API_CNAME" ] || [ "$API_CNAME" = "None" ]; then
    echo "❌ Environment is still launching or doesn't exist"
    echo "Try again in a few minutes with: ./get-api-endpoint.sh"
    exit 1
fi

API_URL="http://$API_CNAME"
echo "✅ API URL: $API_URL"

# Check if the API is responding
echo "Testing API endpoint..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")

if [ "$STATUS" = "200" ]; then
    echo "✅ API is responding on /health"
elif [ "$STATUS" = "404" ]; then
    echo "⚠️  API is running but /health endpoint not found (this is OK if you use different health check)"
else
    echo "⚠️  Health check returned status: $STATUS"
fi

echo ""
echo "📝 Update your frontend API client with this URL:"
echo "   API_BASE_URL = '$API_URL'"
echo ""
echo "Then redeploy the frontend:"
echo "   npx @aws-amplify/cli publish"