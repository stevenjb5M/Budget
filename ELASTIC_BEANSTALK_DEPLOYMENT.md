# Elastic Beanstalk Deployment - Budget Planner API

## ✅ Deployment Started

Your .NET API is now deploying to AWS Elastic Beanstalk!

### Application Details
- **Application Name**: BudgetPlanner
- **Environment Name**: budget-api-prod
- **Platform**: .NET 9 on Amazon Linux 2023
- **Status**: Launching (takes ~5-10 minutes)

### What Was Done
1. ✅ Created Elastic Beanstalk application
2. ✅ Created deployment package (budget-api-eb.zip)
3. ✅ Uploaded to S3 bucket (budget-planner-eb-1763433561)
4. ✅ Created application version (budget-api-v1)
5. ✅ Created production environment (launching now)

### Configuration Files Created
- `.ebextensions/dotnet.config` - .NET configuration
- `.ebextensions/securitygroup.config` - Security group settings
- `.ebextensions/alb.config` - Auto-scaling and load balancing
- `buildspec.yml` - Build specification for CodeBuild

## Getting Your API URL

Once deployment completes (wait 5-10 minutes), get the endpoint:

```bash
aws elasticbeanstalk describe-environments --environment-names budget-api-prod --region us-east-1 --query 'Environments[0].CNAME' --output text
```

Your API will be at: `http://<CNAME>.elasticbeanstalk.com`

Example: `http://budget-api-prod.us-east-1.elasticbeanstalk.com`

## Check Deployment Status

```bash
# View environment status
aws elasticbeanstalk describe-environments --environment-names budget-api-prod --region us-east-1

# View recent events
aws elasticbeanstalk describe-events --environment-name budget-api-prod --region us-east-1
```

## Update Frontend with API Endpoint

Once you have the API URL, update your frontend's API client:

### In `frontend/src/api/client.ts` or similar:

```typescript
const API_BASE_URL = 'http://budget-api-prod.us-east-1.elasticbeanstalk.com';
```

Or set it from environment variables:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://budget-api-prod.us-east-1.elasticbeanstalk.com';
```

### Then redeploy frontend:

```bash
npx @aws-amplify/cli publish
```

## Costs

- **Elastic Beanstalk (t3.micro)**: ~$10-15/month
- **Load Balancer**: ~$20/month
- **Data Transfer**: Usually minimal for internal AWS traffic

You can reduce costs by using a smaller instance type or stopping the environment during off-hours.

## Troubleshooting

If deployment fails, check logs:

```bash
# SSH into the instance
eb ssh

# View application logs
eb logs
```

Or use the AWS Console:
- Go to Elastic Beanstalk → BudgetPlanner → budget-api-prod
- Check the "Recent Logs" section

## Next Steps

1. Wait for deployment to complete (check status with the command above)
2. Get the CNAME (endpoint URL)
3. Update frontend API client with the endpoint
4. Test API calls from the deployed frontend
5. Redeploy frontend to Amplify