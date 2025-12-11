# CloudFormation Setup Guide

## 🎯 What is CloudFormation?

CloudFormation is AWS's **infrastructure-as-code** service. Instead of manually creating resources through the AWS console, you define your entire infrastructure in a **template file** (YAML/JSON), and CloudFormation creates/updates everything automatically.

## 📁 Project Structure

```
Budget/
├── cloudformation-root.yaml          # Main stack (references nested stacks)
├── cloudformation-template.yaml      # Single-file template (alternative)
├── nested-stacks/                    # Modular stack components
│   ├── dynamodb.yaml                # Database tables
│   ├── lambda.yaml                  # Lambda functions
│   ├── api-gateway.yaml             # API Gateway
│   └── frontend.yaml                # S3 + CloudFront
├── deploy.sh                         # Deployment script
└── README.md                         # This file
```

## 🚀 Quick Start

### 1. Prerequisites
```bash
# Install AWS CLI
brew install awscli

# Configure AWS credentials
aws configure
```

### 2. Deploy Everything
```bash
# Make script executable
chmod +x deploy.sh

# Deploy (uses cloudformation-root.yaml by default)
./deploy.sh
```

### 3. Check Deployment
```bash
# View stack status
aws cloudformation describe-stacks --stack-name BudgetPlanner-Serverless

# View stack outputs (URLs, etc.)
aws cloudformation describe-stacks --stack-name BudgetPlanner-Serverless --query 'Stacks[0].Outputs'
```

## 📋 How It Works

### Templates Define Resources
```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-app-bucket
```

### Parameters Make It Flexible
```yaml
Parameters:
  Environment:
    Type: String
    Default: dev

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'my-app-${Environment}'
```

### Outputs Share Information
```yaml
Outputs:
  BucketName:
    Description: S3 Bucket Name
    Value: !Ref MyBucket
    Export:
      Name: !Sub '${Environment}-BucketName'
```

## 🛠️ Common Commands

### Deploy Stack
```bash
aws cloudformation create-stack \
  --stack-name MyStack \
  --template-body file://template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=prod
```

### Update Stack
```bash
aws cloudformation update-stack \
  --stack-name MyStack \
  --template-body file://template.yaml
```

### Delete Stack
```bash
aws cloudformation delete-stack --stack-name MyStack
```

### View Stack Events
```bash
aws cloudformation describe-stack-events --stack-name MyStack
```

## 🔧 Template Features Used

### 1. References (`!Ref`)
```yaml
Resources:
  MyBucket: { Type: AWS::S3::Bucket }
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      Code:
        S3Bucket: !Ref MyBucket  # References bucket name
```

### 2. Substitutions (`!Sub`)
```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${Environment}-my-bucket'  # Inserts parameter
```

### 3. Get Attributes (`!GetAtt`)
```yaml
Outputs:
  BucketDomain:
    Value: !GetAtt MyBucket.RegionalDomainName  # Gets bucket domain
```

### 4. Conditions
```yaml
Conditions:
  IsProduction: !Equals [ !Ref Environment, prod ]

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Condition: IsProduction  # Only create in production
```

## 🏗️ Nested Stacks Benefits

### Why Use Nested Stacks?
- **Modular**: Each stack handles one concern
- **Reusable**: Use same database stack across environments
- **Manageable**: Smaller templates are easier to debug
- **Parallel**: AWS can create stacks in parallel

### Cross-Stack References
```yaml
# In root stack
DynamoDBStack:
  Type: AWS::CloudFormation::Stack
  Properties:
    TemplateURL: ./nested-stacks/dynamodb.yaml

LambdaStack:
  Type: AWS::CloudFormation::Stack
  Properties:
    Parameters:
      UsersTable: !GetAtt DynamoDBStack.Outputs.UsersTableName
```

## 🔍 Debugging

### Check Stack Status
```bash
aws cloudformation describe-stacks --stack-name BudgetPlanner-Serverless --query 'Stacks[0].StackStatus'
```

### View Recent Events
```bash
aws cloudformation describe-stack-events --stack-name BudgetPlanner-Serverless --max-items 10
```

### Validate Template
```bash
aws cloudformation validate-template --template-body file://template.yaml
```

## 📊 Cost Monitoring

CloudFormation itself is **free**. You only pay for the AWS resources it creates:

- Lambda: $0.20 per 1M requests
- API Gateway: $3.50 per million requests
- S3: $0.023 per GB
- CloudFront: $0.085 per GB

## 🎯 Next Steps

1. **Review the templates** in this directory
2. **Run the deployment script**: `./deploy.sh`
3. **Upload Lambda code** to the created S3 bucket
4. **Test your application**
5. **Customize** templates for your needs

## 📚 Resources

- [CloudFormation User Guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
- [Template Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWSCloudFormation-Template-Reference.html)
- [Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)</content>
<parameter name="filePath">/Users/stevenbrown/Budget/CLOUDFORMATION_README.md