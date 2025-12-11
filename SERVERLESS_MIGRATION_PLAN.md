# Budget Planner - Serverless Migration Plan

## 🎯 Overview

**Current Architecture:**
- Backend: ASP.NET Core API on Elastic Beanstalk
- Frontend: React on Amplify
- Database: DynamoDB
- Auth: Cognito

**Target Architecture:**
- Backend: Node.js Lambda functions + API Gateway
- Frontend: React on S3 + CloudFront
- Database: DynamoDB (unchanged)
- Auth: Cognito (unchanged)
- Infrastructure: CloudFormation

## 📋 Migration Strategy

### Phase 1: Infrastructure Setup (Week 1)
### Phase 2: Backend Migration (Week 2)
### Phase 3: Frontend Migration (Week 3)
### Phase 4: Testing & Deployment (Week 4)

---

## 🏗️ Phase 1: Infrastructure Setup

### 1.1 CloudFormation Stack Design

**Main Stack Structure:**
```
BudgetPlanner-Infrastructure (Root Stack)
├── BudgetPlanner-DynamoDB (Nested Stack)
├── BudgetPlanner-Lambda (Nested Stack)
├── BudgetPlanner-API-Gateway (Nested Stack)
├── BudgetPlanner-Frontend (Nested Stack)
└── BudgetPlanner-Cognito (Nested Stack)
```

### 1.2 DynamoDB Tables (Unchanged)
- Keep existing tables but manage via CloudFormation
- Add CloudFormation outputs for table ARNs

### 1.3 Lambda Functions Setup
- One Lambda per controller: Users, Plans, Budgets, Assets, Debts
- Runtime: Node.js 20.x
- Memory: 256MB (start small, scale up if needed)
- Timeout: 30 seconds

### 1.4 API Gateway Configuration
- REST API with Cognito authorizer
- CORS enabled for frontend domain
- Request/response mapping templates

### 1.5 S3 + CloudFront Setup
- S3 bucket with public read access (via CloudFront only)
- CloudFront distribution with:
  - Custom error pages (SPA routing)
  - HTTPS redirect
  - Price class 100 (US, Europe, etc.)

### 1.6 Cognito User Pool (Unchanged)
- Keep existing user pool
- Update callback URLs for new domain

---

## 🔄 Phase 2: Backend Migration (Node.js)

### 2.1 Project Structure
```
backend/
├── src/
│   ├── functions/
│   │   ├── users.js
│   │   ├── plans.js
│   │   ├── budgets.js
│   │   ├── assets.js
│   │   └── debts.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── cors.js
│   ├── services/
│   │   └── dynamoService.js
│   └── utils/
│       └── responses.js
├── package.json
├── serverless.yml (optional)
└── template.yaml (CloudFormation)
```

### 2.2 Dependencies Migration
**From C# to Node.js:**
- `aws-sdk` → `@aws-sdk/client-dynamodb`
- `Microsoft.AspNetCore.Authentication.JwtBearer` → `jsonwebtoken`
- Entity Framework → Custom DynamoDB service
- ASP.NET Core MVC → Express.js style routing

### 2.3 Authentication Changes
**Current:** ASP.NET Core JWT middleware
**New:** Custom Lambda authorizer function
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

exports.authenticate = async (event) => {
  const token = event.headers.Authorization?.replace('Bearer ', '');
  if (!token) return { statusCode: 401, body: 'Unauthorized' };

  try {
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    return { statusCode: 401, body: 'Invalid token' };
  }
};
```

### 2.4 DynamoDB Service Migration
**Current:** C# with AWS SDK
**New:** Node.js with AWS SDK v3
```javascript
// services/dynamoService.js
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');

class DynamoService {
  constructor() {
    this.client = new DynamoDBClient({ region: process.env.AWS_REGION });
  }

  async getUser(userId) {
    const params = {
      TableName: process.env.USERS_TABLE,
      Key: { id: { S: userId } }
    };
    // Implementation...
  }
}
```

### 2.5 API Response Format Changes
**Current:** ASP.NET Core IActionResult
**New:** API Gateway Lambda Proxy Integration
```javascript
// Standard response format
exports.createResponse = (statusCode, body) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.FRONTEND_URL,
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(body)
  };
};
```

---

## 🎨 Phase 3: Frontend Migration

### 3.1 Build Process Changes
**Current:** Amplify build pipeline
**New:** GitHub Actions + AWS CLI

### 3.2 Environment Variables
Update API endpoints in environment files:
```bash
# .env.production
VITE_API_URL=https://your-api-gateway-url.amazonaws.com/prod
VITE_USER_POOL_ID=your-cognito-pool-id
VITE_USER_POOL_CLIENT_ID=your-client-id
```

### 3.3 CloudFront Configuration
- SPA routing support (handle 404s → index.html)
- Custom error pages
- Cache invalidation on deploy

### 3.4 DNS Updates
- Update Route 53 records
- SSL certificate migration
- CDN propagation time

---

## 🧪 Phase 4: Testing & Deployment

### 4.1 Testing Strategy
- Unit tests for Lambda functions
- Integration tests for API Gateway
- E2E tests for frontend
- Load testing for Lambda cold starts

### 4.2 Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [ main ]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
      - name: Deploy CloudFormation
        run: aws cloudformation deploy --template-file template.yaml --stack-name BudgetPlanner
      - name: Deploy Lambda functions
        run: aws lambda update-function-code --function-name UsersFunction --zip-file fileb://functions.zip

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
      - name: Build
        run: npm run build
      - name: Deploy to S3
        run: aws s3 sync dist/ s3://your-bucket-name --delete
      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 4.3 Rollback Plan
- Keep Elastic Beanstalk active during migration
- Blue-green deployment strategy
- Feature flags for gradual rollout

---

## 💰 Cost Analysis

### Current Costs (Monthly)
- Amplify: $0-5
- Elastic Beanstalk: $15-25
- DynamoDB: $0-10
- **Total: $15-40**

### New Costs (Monthly)
- Lambda: $0-3 (1M requests free)
- API Gateway: $0-2 (1M requests free)
- S3: $0-1 (5GB free)
- CloudFront: $0-2 (1TB free)
- **Total: $0-8**

**Savings: $7-32/month (70-80% reduction)**

---

## ⏱️ Timeline & Milestones

### Week 1: Infrastructure Foundation
- [ ] Create CloudFormation templates
- [ ] Set up S3 + CloudFront
- [ ] Deploy base infrastructure
- [ ] Test CloudFormation stack

### Week 2: Backend Development
- [ ] Create Node.js project structure
- [ ] Implement DynamoDB service
- [ ] Create Lambda functions (one per controller)
- [ ] Set up API Gateway integration
- [ ] Test Lambda functions locally

### Week 3: Frontend Migration
- [ ] Update API client for new endpoints
- [ ] Configure build pipeline
- [ ] Test frontend with new backend
- [ ] Set up CloudFront distribution

### Week 4: Testing & Go-Live
- [ ] End-to-end testing
- [ ] Performance testing
- [ ] DNS cutover
- [ ] Monitor and optimize

---

## ⚠️ Risks & Mitigation

### High Risk: Cold Start Performance
**Impact:** Lambda cold starts (2-5 seconds)
**Mitigation:**
- Use provisioned concurrency for critical functions
- Optimize bundle size
- Implement caching strategies

### Medium Risk: Node.js Learning Curve
**Impact:** Team needs to learn Node.js
**Mitigation:**
- Start with simple functions
- Use established patterns
- Comprehensive testing

### Low Risk: CloudFormation Complexity
**Impact:** Infrastructure changes harder to debug
**Mitigation:**
- Use nested stacks
- Test templates in dev environment
- Keep manual backups

---

## 🔧 Technical Details

### Lambda Function Structure
```javascript
// functions/users.js
const { authenticate } = require('../middleware/auth');
const { DynamoService } = require('../services/dynamoService');
const { createResponse } = require('../utils/responses');

const dynamoService = new DynamoService();

exports.getCurrentUser = async (event) => {
  try {
    const user = await authenticate(event);
    if (!user) return createResponse(401, { error: 'Unauthorized' });

    const userData = await dynamoService.getUser(user.sub);
    return createResponse(200, userData);
  } catch (error) {
    console.error('Error getting user:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
```

### CloudFormation Template Example
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Budget Planner Lambda Functions'

Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, prod]

Resources:
  UsersFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'BudgetPlanner-Users-${Environment}'
      Runtime: nodejs20.x
      Handler: functions/users.getCurrentUser
      Code:
        S3Bucket: !Ref CodeBucket
        S3Key: lambda-functions.zip
      MemorySize: 256
      Timeout: 30
      Environment:
        Variables:
          USERS_TABLE: !Ref UsersTable
          AWS_REGION: !Ref AWS::Region

  UsersApiPermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref UsersFunction
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
```

---

## 📊 Success Metrics

- [ ] All Lambda functions deploy successfully
- [ ] API Gateway responds correctly
- [ ] Frontend loads from CloudFront
- [ ] Authentication works with Cognito
- [ ] DynamoDB operations function properly
- [ ] End-to-end user flows work
- [ ] Performance meets requirements (< 2s response time)
- [ ] Costs reduced by 70%+

---

## 🚀 Next Steps

1. **Review and approve this plan**
2. **Set up development environment for Node.js**
3. **Create CloudFormation templates**
4. **Begin with Phase 1 infrastructure setup**

**Total Timeline:** 4 weeks
**Total Savings:** $7-32/month
**Risk Level:** Medium (mostly technical learning curve)

Ready to start implementation?</content>
<parameter name="filePath">/Users/stevenbrown/Budget/SERVERLESS_MIGRATION_PLAN.md