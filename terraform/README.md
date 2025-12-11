# Budget Planner - Terraform vs CloudFormation Showcase

This directory contains a **Terraform implementation** of the Budget Planner infrastructure alongside the existing CloudFormation setup.

## 🎯 Why Show Both?

### **CloudFormation**
- AWS-native, excellent for AWS-only projects
- Automatic state management
- Built-in rollback on failure

### **Terraform**
- Multi-cloud compatible (AWS, Azure, GCP, etc.)
- Cleaner HCL syntax
- Better for showcasing modern infrastructure patterns
- Larger community and ecosystem

## 📁 Terraform Structure

```
terraform/
├── main.tf              # Provider configuration
├── variables.tf         # Input variables with validation
├── outputs.tf          # Output values
├── dynamodb.tf         # DynamoDB tables (6 tables)
├── lambda.tf           # Lambda functions & IAM roles
├── api_gateway.tf      # API Gateway configuration
├── frontend.tf         # S3 & CloudFront for frontend
├── terraform.tfvars.example  # Example variable values
├── .gitignore          # Ignore terraform state files
├── deploy.sh           # Deployment script
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Install Terraform
```bash
# macOS with Homebrew
brew install terraform

# Or download from: https://www.terraform.io/downloads.html
```

### 2. Configure AWS Credentials
```bash
aws configure
```

### 3. Copy Variables File
```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

### 4. Deploy
```bash
cd terraform
chmod +x deploy.sh
./deploy.sh
```

## 📊 Side-by-Side Comparison

### DynamoDB Table Definition

**Terraform (HCL) - Cleaner:**
```hcl
resource "aws_dynamodb_table" "users" {
  name         = "BudgetPlanner-Users-${var.environment}"
  billing_mode = var.dynamodb_billing_mode
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}
```

**CloudFormation (YAML) - More verbose:**
```yaml
Resources:
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'BudgetPlanner-Users-${Environment}'
      BillingMode: !Ref DynamoDBBillingMode
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
```

### Lambda Function Definition

**Terraform:**
```hcl
resource "aws_lambda_function" "users" {
  filename      = "lambda-functions.zip"
  function_name = "BudgetPlanner-Users-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "functions/users.handler"
  runtime       = "nodejs20.x"
  memory_size   = var.lambda_memory
  timeout       = var.lambda_timeout

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
    }
  }
}
```

**CloudFormation:**
```yaml
Resources:
  UsersFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'BudgetPlanner-Users-${Environment}'
      Runtime: nodejs20.x
      Handler: functions/users.handler
      Code:
        S3Bucket: !Ref CodeBucket
        S3Key: lambda.zip
      MemorySize: !Ref LambdaMemory
      Timeout: !Ref LambdaTimeout
      Environment:
        Variables:
          USERS_TABLE: !Ref UsersTable
      Role: !GetAtt LambdaExecutionRole.Arn
```

## 🔧 Key Features

### 1. **Input Validation**
```hcl
variable "environment" {
  type = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod"
  }
}
```

### 2. **Dynamic Configuration**
```bash
# Deploy to different environments
terraform apply -var="environment=prod" -var="lambda_memory=512"
```

### 3. **Infrastructure as Code**
- Version control for infrastructure
- Code review process for changes
- Reusable modules for other projects

### 4. **State Management**
```hcl
# Local state (development)
terraform.tfstate  # Don't commit this

# Production (optional S3 backend)
# See comments in main.tf
```

## 📋 Common Commands

### Initialize
```bash
terraform init
```

### Validate
```bash
terraform validate
```

### Plan
```bash
terraform plan -out=tfplan
```

### Apply
```bash
terraform apply tfplan
```

### Destroy
```bash
terraform destroy
```

### View State
```bash
terraform state list
terraform state show aws_dynamodb_table.users
```

### Output Values
```bash
terraform output
terraform output api_gateway_url
```

## 🎯 Advantages of Terraform Approach

1. **Cleaner Syntax**: HCL is more readable than YAML
2. **Type Validation**: Catch errors before deployment
3. **Multi-Cloud Ready**: Same code for AWS, Azure, GCP
4. **Reusable Modules**: Share across projects
5. **Large Community**: More resources and modules available
6. **Better Tooling**: Workspace management, linting, formatting

## 🚀 Deploy with Terraform

```bash
cd terraform
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. ✅ Check Terraform is installed
2. ✅ Initialize Terraform
3. ✅ Validate configuration
4. ✅ Plan deployment
5. ✅ Ask for confirmation
6. ✅ Apply infrastructure
7. ✅ Show outputs

## 📚 Files Explained

| File | Purpose |
|------|---------|
| `main.tf` | Provider setup, default tags |
| `variables.tf` | Input variables with defaults and validation |
| `outputs.tf` | Output values (URLs, table names, etc.) |
| `dynamodb.tf` | All 6 DynamoDB table definitions |
| `lambda.tf` | Lambda functions and IAM roles |
| `api_gateway.tf` | API Gateway REST API configuration |
| `frontend.tf` | S3 bucket and CloudFront distribution |
| `terraform.tfvars.example` | Example variable values |
| `.gitignore` | Exclude terraform state files |
| `deploy.sh` | Automated deployment script |

## 🔐 Security Best Practices

### State File Management
```bash
# Never commit terraform.tfstate!
# Use S3 backend for production:

terraform {
  backend "s3" {
    bucket         = "terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

### Variable Sensitivity
```hcl
# Mark sensitive values
output "environment_variables" {
  sensitive = true
  value = {
    API_KEY = aws_secretsmanager_secret.api_key.arn
  }
}
```

## 📊 Cost Estimation

```bash
# Estimate costs
terraform plan | grep -i cost

# Or use Infracost
brew install infracost
infracost breakdown --path .
```

## 🎓 Learning Resources

- [Terraform Official Docs](https://www.terraform.io/docs/)
- [AWS Terraform Provider](https://registry.terraform.io/providers/hashicorp/aws/latest)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices.html)
- [Terraform Registry Modules](https://registry.terraform.io/browse/modules)

## 🔄 Next Steps

1. **Copy variables file**: `cp terraform.tfvars.example terraform.tfvars`
2. **Edit variables**: Update `terraform.tfvars` with your values
3. **Initialize**: `terraform init`
4. **Plan**: `terraform plan`
5. **Deploy**: `terraform apply`
6. **View outputs**: `terraform output`

---

**This Terraform setup is production-ready and demonstrates modern infrastructure-as-code best practices while maintaining feature parity with the CloudFormation setup.**
