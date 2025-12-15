# Budget Planner Lambda Backend

Node.js Lambda functions for the Budget Planner application. This replaces the C# Elastic Beanstalk backend with serverless AWS Lambda functions.

## Architecture

```
lambda/
├── src/
│   ├── handlers/           # Lambda function handlers
│   │   ├── users.ts       # User CRUD operations
│   │   ├── plans.ts       # Plan CRUD operations
│   │   ├── budgets.ts     # Budget CRUD operations
│   │   ├── assets.ts      # Asset CRUD operations
│   │   └── debts.ts       # Debt CRUD operations
│   ├── services/
│   │   └── dynamodbService.ts    # DynamoDB operations layer
│   ├── middleware/
│   │   └── auth.ts        # Cognito authentication
│   ├── utils/
│   │   └── response.ts    # HTTP response utilities
│   ├── constants.ts       # Application constants
│   ├── types.ts           # TypeScript interfaces
│   └── index.ts           # Export all handlers
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+ (Lambda supports Node.js 18.x and 20.x)
- AWS CLI configured with credentials
- npm or yarn

### Installation

```bash
cd lambda
npm install
```

### Build

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

## API Endpoints

All endpoints require Cognito authentication via Bearer token in the Authorization header.

### Users
- `GET /users` - Get current user profile
- `PUT /users/{id}` - Update user profile
- `POST /users` - Create new user

### Plans
- `GET /plans` - Get all user plans
- `GET /plans/{id}` - Get specific plan
- `POST /plans` - Create new plan
- `PUT /plans/{id}` - Update plan
- `DELETE /plans/{id}` - Delete plan

### Budgets
- `GET /budgets?planId={id}` - Get budgets for a plan
- `POST /budgets` - Create new budget
- `PUT /budgets/{id}` - Update budget
- `DELETE /budgets/{id}` - Delete budget

### Assets
- `GET /assets` - Get all user assets
- `POST /assets` - Create new asset
- `PUT /assets/{id}` - Update asset
- `DELETE /assets/{id}` - Delete asset

### Debts
- `GET /debts` - Get all user debts
- `POST /debts` - Create new debt
- `PUT /debts/{id}` - Update debt
- `DELETE /debts/{id}` - Delete debt

## Environment Variables

The Lambda functions use the following environment variables (set by Terraform):

```
USERS_TABLE=Users
PLANS_TABLE=Plans
BUDGETS_TABLE=Budgets
ASSETS_TABLE=Assets
DEBTS_TABLE=Debts
USER_VERSIONS_TABLE=UserVersions
AWS_REGION=us-east-1
```

## DynamoDB Tables

Each Lambda function requires access to DynamoDB tables:

- **Users** - Stores user profiles
  - Key: `id` (string)
  - Attributes: firstName, lastName, email, birthDate, version, timestamps

- **Plans** - Stores financial plans
  - Key: `id` (string)
  - GSI: `userIdIndex` (partition key: `userId`)
  - Attributes: name, description, dates, version, timestamps

- **Budgets** - Stores budgets within plans
  - Key: `id` (string)
  - GSI: `planIdIndex` (partition key: `planId`)
  - Attributes: amount, spent, version, timestamps

- **Assets** - Stores user assets
  - Key: `id` (string)
  - GSI: `userIdIndex` (partition key: `userId`)
  - Attributes: value, category, version, timestamps

- **Debts** - Stores user debts
  - Key: `id` (string)
  - GSI: `userIdIndex` (partition key: `userId`)
  - Attributes: creditor, amount, interestRate, dueDate, version, timestamps

- **UserVersions** - Stores versioning history
  - Key: `id` (string)
  - Attributes: userId, version, data, timestamp

## Error Handling

All handlers return standardized error responses:

```json
{
  "statusCode": 400,
  "body": {
    "error": "Invalid input provided",
    "details": {
      "missingFields": ["name", "amount"]
    }
  }
}
```

## Development

### Run tests
```bash
npm run test
```

### Run with coverage
```bash
npm run test:coverage
```

### Lint code
```bash
npm run lint
```

## Security

- **Authentication**: All endpoints require valid Cognito JWT token
- **Authorization**: Users can only access their own data
- **Input Validation**: Required fields and types are validated
- **CORS**: Configured to allow requests from frontend

## Migration from C# Backend

### Key Differences

1. **Language**: TypeScript/Node.js instead of C#
2. **Framework**: AWS Lambda instead of ASP.NET Core
3. **Database**: Direct DynamoDB access instead of Entity Framework
4. **Async/Await**: Native Promise-based instead of Task-based
5. **Deployment**: Terraform/AWS CLI instead of Elastic Beanstalk

### Data Structure Compatibility

All data structures maintain compatibility with the C# backend:
- Same field names and types
- Version tracking for all entities
- Timestamp management (createdAt, updatedAt)
- UUID for entity IDs

## Testing

### Unit Tests

Create test files for each handler:

```typescript
// src/handlers/__tests__/users.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getUserHandler } from '../users';

describe('getUserHandler', () => {
  it('should return user data for authenticated request', async () => {
    // Test implementation
  });
});
```

### Integration Tests

Test the full flow including DynamoDB mock:

```typescript
// Uses LocalStack or moto for local DynamoDB testing
```

## Deployment

### Via Terraform

The Lambda functions are deployed using Terraform in `../terraform/lambda.tf`:

```bash
cd ../terraform
terraform plan
terraform apply
```

### Manual Deployment

1. Build the functions:
```bash
npm run build
```

2. Package for Lambda:
```bash
npm run package
```

3. Upload to AWS Lambda via AWS CLI or AWS Console

## Monitoring

### CloudWatch Logs

View logs for each Lambda function:

```bash
aws logs tail /aws/lambda/BudgetPlanner-users-dev --follow
aws logs tail /aws/lambda/BudgetPlanner-plans-dev --follow
aws logs tail /aws/lambda/BudgetPlanner-budgets-dev --follow
aws logs tail /aws/lambda/BudgetPlanner-assets-dev --follow
aws logs tail /aws/lambda/BudgetPlanner-debts-dev --follow
```

### CloudWatch Metrics

- **Invocations**: Number of Lambda invocations
- **Duration**: Execution time (target: < 1 second)
- **Errors**: Number of failures
- **Throttles**: Rate limit errors (monitor for scaling)

## Performance

Lambda cold start typically: **100-300ms**
Warm execution: **10-50ms**

### Optimization Tips

1. Increase Lambda memory to improve CPU (auto-scales execution)
2. Use VPC only if necessary (adds 1-5s cold start overhead)
3. Bundle dependencies before deployment
4. Enable Lambda insights for detailed monitoring

## Troubleshooting

### "Cannot find module" errors

Ensure all dependencies are installed:
```bash
npm install
```

### DynamoDB access denied

Check IAM role permissions in Terraform. The role should have:
- `dynamodb:GetItem`
- `dynamodb:PutItem`
- `dynamodb:UpdateItem`
- `dynamodb:DeleteItem`
- `dynamodb:Query`

### Authentication failures

Verify:
1. Cognito User Pool is configured correctly
2. API Gateway Cognito authorizer is attached
3. JWT token is valid and not expired
4. Authorization header format: `Authorization: Bearer <token>`

## Next Steps

1. **Deploy Infrastructure**: `cd terraform && terraform apply`
2. **Test API Endpoints**: Use Postman or curl with valid JWT token
3. **Monitor Logs**: Check CloudWatch for errors
4. **Load Test**: Verify Lambda scales under load
5. **Frontend Integration**: Update frontend API endpoints to use new Lambda URLs

## Cost Estimation

With AWS Free Tier:
- **Lambda**: 1M free requests/month, 3.2M free compute seconds
- **DynamoDB**: 25GB storage free
- **API Gateway**: 1M free API calls/month
- **CloudWatch**: Some free logs

Estimated monthly cost: **$0-10** for moderate usage

## License

Same as parent project

## References

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/latest/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/BestPractices.html)
- [API Gateway with Lambda](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
