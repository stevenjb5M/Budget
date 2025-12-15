# C# to Node.js Lambda Migration Guide

## Overview

This document outlines the migration from the ASP.NET Core C# backend (Elastic Beanstalk) to Node.js Lambda functions.

## Project Structure

```
Backend Migration:
├── backend/                    # Original C# backend (to be deprecated)
│   ├── Controllers/
│   ├── Models/
│   ├── Services/
│   └── Program.cs
├── lambda/                     # New Node.js Lambda backend
│   ├── src/
│   │   ├── handlers/          # Lambda function handlers
│   │   ├── services/          # Business logic layer
│   │   ├── middleware/        # Authentication & middleware
│   │   ├── utils/             # Utilities
│   │   ├── constants.ts       # Constants
│   │   └── types.ts           # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
└── terraform/                  # Infrastructure as Code
    ├── lambda.tf              # Lambda function definitions
    ├── api_gateway.tf         # API Gateway routes
    └── dynamodb.tf            # DynamoDB tables
```

## Migration Steps

### Phase 1: Code Generation ✅
- [x] Create Node.js project structure
- [x] Set up TypeScript configuration
- [x] Create Lambda handlers for all endpoints
- [x] Implement DynamoDB service layer
- [x] Add authentication middleware
- [x] Write response utilities

### Phase 2: Testing (Next)
- [ ] Install dependencies
- [ ] Write unit tests for handlers
- [ ] Write integration tests with DynamoDB mock
- [ ] Test all API endpoints

### Phase 3: Deployment (After Testing)
- [ ] Update Terraform Lambda function definitions with Node.js code
- [ ] Deploy Lambda functions to AWS
- [ ] Configure API Gateway routes
- [ ] Test endpoints against deployed infrastructure

### Phase 4: Frontend Integration (After Deployment)
- [ ] Update frontend API endpoints
- [ ] Test frontend-backend integration
- [ ] Validate data flow end-to-end

### Phase 5: Cutover (Final)
- [ ] Monitor Lambda performance
- [ ] Verify all features working
- [ ] Decommission C# backend
- [ ] Update documentation

## Code Mapping: C# → Node.js

### Controllers → Handlers

**C# Pattern:**
```csharp
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUser(string id)
    {
        // Logic
    }
}
```

**Node.js Pattern:**
```typescript
export const getUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Logic
  return successResponse(user);
};
```

### Models → Types

**C# Pattern:**
```csharp
[DynamoDBTable("Users")]
public class User
{
    [DynamoDBHashKey]
    public string Id { get; set; }
    public string FirstName { get; set; }
    // Properties
}
```

**Node.js Pattern:**
```typescript
export interface User {
  id: string;
  firstName: string;
  // Fields
}
```

### Services → DynamoDB Service

**C# Pattern:**
```csharp
public class UserService
{
    public async Task<User> GetUserAsync(string id)
    {
        // DynamoDB operation
    }
}
```

**Node.js Pattern:**
```typescript
async getUser(userId: string): Promise<User | null> {
  const command = new GetCommand({
    TableName: TABLES.USERS,
    Key: { id: userId },
  });
  const result = await docClient.send(command);
  return result.Item as User;
}
```

### Dependency Injection → Service Singleton

**C# Pattern:**
```csharp
services.AddScoped<IUserService, UserService>();
```

**Node.js Pattern:**
```typescript
export default new DynamoDBService();
// Imported as: import dynamodbService from '../services/dynamodbService';
```

## API Endpoint Mapping

### Users
| Operation | C# Endpoint | Node.js Handler |
|-----------|------------|-----------------|
| Get User | `GET /api/users/{id}` | `getUserHandler` |
| Update User | `PUT /api/users/{id}` | `updateUserHandler` |
| Create User | `POST /api/users` | `createUserHandler` |

### Plans
| Operation | C# Endpoint | Node.js Handler |
|-----------|------------|-----------------|
| Get Plans | `GET /api/plans` | `getPlansHandler` |
| Get Plan | `GET /api/plans/{id}` | `getPlanHandler` |
| Create Plan | `POST /api/plans` | `createPlanHandler` |
| Update Plan | `PUT /api/plans/{id}` | `updatePlanHandler` |
| Delete Plan | `DELETE /api/plans/{id}` | `deletePlanHandler` |

### Budgets, Assets, Debts
Similar mapping for budgets, assets, and debts endpoints.

## Data Compatibility

### Field Name Mapping
- C# uses PascalCase → Node.js uses camelCase in runtime
- Database stores consistent field names (lowercase_snake_case in some cases)
- DynamoDB JSON format handles conversion automatically

### Timestamp Handling

**C#:**
```csharp
public DateTime CreatedAt { get; set; }
public DateTime UpdatedAt { get; set; }
```

**Node.js:**
```typescript
createdAt: string;  // ISO 8601 format
updatedAt: string;  // ISO 8601 format
```

### Version Tracking

Both systems implement versioning for data auditing:
- Initial version: `1`
- Incremented on updates
- Stored in database for concurrency control

## Environment Variables

### C# Backend
```
ASPNETCORE_ENVIRONMENT=Production
AWS_REGION=us-east-1
```

### Node.js Lambda
```
USERS_TABLE=Users
PLANS_TABLE=Plans
BUDGETS_TABLE=Budgets
ASSETS_TABLE=Assets
DEBTS_TABLE=Debts
USER_VERSIONS_TABLE=UserVersions
AWS_REGION=us-east-1
```

## Error Handling

### C# Pattern
```csharp
if (user == null)
    return NotFound("User not found");

return BadRequest("Invalid input");
```

### Node.js Pattern
```typescript
if (!user) 
  return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);

return errorResponse(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.INVALID_INPUT);
```

## Authentication

### C# Backend
- AWS Cognito via ASP.NET Core middleware
- JWT token validation in pipeline

### Node.js Lambda
- AWS Cognito via API Gateway authorizer
- JWT token extracted from `event.requestContext.authorizer`

## Performance Comparison

| Metric | C# (Beanstalk) | Node.js (Lambda) |
|--------|---------------|-----------------|
| Cold Start | N/A (always warm) | 100-300ms |
| Warm Request | 50-100ms | 10-50ms |
| Memory | 512MB+ (instance) | 256MB (configurable) |
| Scaling | Minutes | Automatic (milliseconds) |
| Cost | $15-25/month | $0-10/month |

## Testing Strategy

### Unit Tests
Test individual handlers and business logic:
```typescript
describe('getUserHandler', () => {
  it('should return 401 for unauthorized request', async () => {
    const result = await getUserHandler(unauthorizedEvent);
    expect(result.statusCode).toBe(401);
  });
});
```

### Integration Tests
Test with mocked DynamoDB (LocalStack):
```typescript
describe('User Integration', () => {
  beforeAll(() => {
    // Start LocalStack DynamoDB
  });
  
  it('should create and retrieve user', async () => {
    // Test flow
  });
});
```

### End-to-End Tests
Test deployed Lambda functions:
```typescript
describe('E2E Tests', () => {
  it('should handle complete user lifecycle', async () => {
    // Create, read, update, delete user
  });
});
```

## Rollback Strategy

If issues occur:

1. **Quick Rollback**: Keep C# backend running, update API Gateway to route back to Beanstalk
2. **Data Consistency**: Both systems use same DynamoDB tables, so switching is safe
3. **Testing**: Fully test before switching production traffic
4. **Gradual Migration**: Use API Gateway weighted routing to gradually shift traffic (10% → 50% → 100%)

## Monitoring & Logging

### CloudWatch
- **Log Groups**: `/aws/lambda/BudgetPlanner-*-dev`
- **Metrics**: Duration, errors, throttles, concurrent executions
- **Alarms**: Set up alerts for errors and high latency

### X-Ray
- Enable X-Ray tracing for performance analysis
- Trace requests through API Gateway → Lambda → DynamoDB

### Application Insights
- Track API response times
- Monitor error rates
- Alert on anomalies

## Documentation Updates

After migration, update:
- [ ] API documentation to reference Lambda endpoints
- [ ] Architecture diagrams showing Lambda + DynamoDB
- [ ] Deployment procedures
- [ ] Troubleshooting guides
- [ ] Performance benchmarks

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Code Generation | 1-2 hours | ✅ Complete |
| Testing | 4-8 hours | ⏳ Next |
| Deployment | 2-4 hours | ⏳ Pending |
| Frontend Integration | 2-4 hours | ⏳ Pending |
| Production Cutover | 1 hour | ⏳ Pending |

**Estimated Total Time**: 1-2 weeks

## Costs Savings

**Current (Elastic Beanstalk)**: $15-25/month
**New (Lambda)**: $0-10/month
**Savings**: 60-70% cost reduction

AWS Free Tier covers:
- 1M Lambda requests/month
- 3.2M Lambda compute seconds/month
- 25GB DynamoDB storage
- 1M API Gateway calls/month

## Support & Questions

Refer to:
- AWS Lambda documentation: https://docs.aws.amazon.com/lambda/
- AWS SDK for JavaScript: https://docs.aws.amazon.com/sdk-for-javascript/
- DynamoDB best practices: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/
