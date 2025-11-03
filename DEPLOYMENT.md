# Deployment Guide

This guide covers deploying Budget Planner to AWS.

## Architecture Overview

```
Users
  ↓
CloudFront (CDN)
  ↓
S3 (Frontend Static Files)
  
REST API Requests
  ↓
Elastic Beanstalk (ASP.NET Core Backend)
  ↓
DynamoDB (Database)
  
Cognito (Authentication)
CloudWatch (Monitoring)
```

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured locally
- .NET 8 SDK installed
- Node.js 16+ installed

## Phase 1: AWS Setup (Not Yet Implemented)

The following AWS resources need to be set up:

### 1. Amazon Cognito
- Create User Pool
- Create User Pool Client
- Configure domain
- Set up hosted UI (optional)

### 2. DynamoDB
- Create tables:
  - Users
  - Plans
  - Budgets
  - Assets
  - Debts
  - Transactions

### 3. S3
- Create bucket for frontend
- Enable versioning
- Configure bucket policy for CloudFront access

### 4. CloudFront
- Create distribution
- Point to S3 origin
- Set up SSL/TLS certificate

### 5. Elastic Beanstalk
- Create application
- Create environment
- Configure auto-scaling
- Set up environment variables

### 6. CloudWatch
- Configure logs
- Set up alarms
- Create dashboards

## Phase 2: Backend Deployment

1. Build release version:
```bash
cd backend
dotnet publish -c Release -o ./publish
```

2. Create `.ebextensions` directory:
```bash
mkdir -p backend/.ebextensions
```

3. Deploy to Elastic Beanstalk:
```bash
eb create budget-planner-env
eb deploy
```

## Phase 3: Frontend Deployment

1. Build for production:
```bash
cd frontend
npm run build
```

2. Upload to S3:
```bash
aws s3 sync dist/ s3://budget-planner-bucket/
```

3. Invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## Environment Configuration

### Backend (Elastic Beanstalk)
Set environment variables:
- `AWS_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `DYNAMODB_ENDPOINT` (production DynamoDB)

### Frontend (S3/CloudFront)
Update API endpoint in code for production:
```typescript
const API_URL = process.env.VITE_API_URL || 'https://api.budgetplanner.com'
```

## Monitoring

### CloudWatch
- Monitor application logs
- Set up alarms for errors
- Track API performance metrics

### Health Checks
- Configure Elastic Beanstalk health checks
- Monitor DynamoDB throughput
- Monitor S3 and CloudFront metrics

## Rollback Procedure

### Backend
```bash
eb appversion
eb deploy budget-planner-env -l previous-version
```

### Frontend
```bash
# Revert S3 objects to previous version
aws s3api list-object-versions \
  --bucket budget-planner-bucket

# Restore previous version
```

## Costs

Estimated monthly costs (using AWS Free Tier where applicable):
- Cognito: ~$0 (free tier includes 50K monthly active users)
- DynamoDB: ~$5-20 (on-demand pricing)
- S3: ~$1 (minimal storage)
- CloudFront: ~$5-10 (minimal traffic)
- Elastic Beanstalk: ~$10-50 (depends on instance type and traffic)
- CloudWatch: ~$5 (logs and monitoring)

**Total estimated: $25-85/month for low-traffic application**

## Security Considerations

- Enable SSL/TLS for all connections
- Use IAM roles for EC2 instances
- Enable DynamoDB encryption at rest
- Use environment variables for secrets (not hardcoded)
- Enable CloudTrail for audit logging
- Configure security groups properly
- Use CORS carefully
- Enable Cognito MFA (optional)

## Scaling Strategy

### DynamoDB
- Start with on-demand pricing
- Monitor usage patterns
- Consider provisioned capacity if predictable
- Enable auto-scaling

### Elastic Beanstalk
- Start with single instance
- Configure auto-scaling based on CPU/network
- Use load balancer for multi-instance setup

### Frontend
- CloudFront handles scaling automatically
- S3 scales infinitely

## Maintenance

- Regular security updates
- Monitor AWS service updates
- Review and optimize costs monthly
- Backup DynamoDB tables
- Monitor database performance
- Keep dependencies updated
