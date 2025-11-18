# Amplify Backend Setup Guide

Your Amplify backend has been configured to:

1. **Reference your existing DynamoDB tables:**
   - BudgetPlanner-Users
   - BudgetPlanner-Assets
   - BudgetPlanner-Budgets
   - BudgetPlanner-Debts
   - BudgetPlanner-Plans
   - BudgetPlanner-UserVersions

2. **Lambda Function:** BudgetPlannerAPI
   - Acts as a wrapper for your .NET API
   - Can be customized to proxy requests to your running .NET backend

## Next Steps

1. **Push your backend to AWS:**
   ```bash
   npx @aws-amplify/cli push
   ```

2. **Update your .NET API** to accept requests from API Gateway or create a Lambda wrapper that forwards requests to your backend.

3. **Configure environment variables** in the Lambda function to point to your .NET API endpoint if running separately.

## Alternative Approach

If you want your .NET API to be the direct backend, you can:
- Deploy the .NET API to ECS/Fargate or Elastic Beanstalk
- Update the Lambda function to proxy requests to your API
- Configure API Gateway to call your .NET API directly

This approach allows you to keep your existing DynamoDB tables while leveraging Amplify's hosting and API management.