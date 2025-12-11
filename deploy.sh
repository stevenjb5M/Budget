#!/bin/bash
# CloudFormation Deployment Script for Budget Planner

set -e

# Configuration
STACK_NAME="BudgetPlanner-Serverless"
TEMPLATE_FILE="cloudformation-template.yaml"
ENVIRONMENT="dev"
AWS_REGION="us-east-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting CloudFormation deployment for Budget Planner${NC}"
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run 'aws configure' first.${NC}"
    exit 1
fi

# Validate template
echo -e "${YELLOW}📋 Validating CloudFormation template...${NC}"
if aws cloudformation validate-template --template-body file://$TEMPLATE_FILE --region $AWS_REGION; then
    echo -e "${GREEN}✅ Template validation successful${NC}"
else
    echo -e "${RED}❌ Template validation failed${NC}"
    exit 1
fi

# Check if stack exists
if aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION &> /dev/null; then
    echo -e "${YELLOW}🔄 Stack exists, updating...${NC}"
    OPERATION="update-stack"
    OPERATION_NAME="update"
else
    echo -e "${YELLOW}🆕 Stack doesn't exist, creating...${NC}"
    OPERATION="create-stack"
    OPERATION_NAME="create"
fi

# Deploy stack
echo -e "${YELLOW}🚀 Deploying CloudFormation stack...${NC}"
aws cloudformation $OPERATION \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION

# Wait for completion
echo -e "${YELLOW}⏳ Waiting for stack ${OPERATION_NAME} to complete...${NC}"
aws cloudformation wait stack-${OPERATION_NAME}-complete \
    --stack-name $STACK_NAME \
    --region $AWS_REGION

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Stack ${OPERATION_NAME} completed successfully!${NC}"

    # Get outputs
    echo
    echo -e "${GREEN}📋 Stack Outputs:${NC}"
    aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --region $AWS_REGION \
        --query 'Stacks[0].Outputs' \
        --output table
else
    echo -e "${RED}❌ Stack ${OPERATION_NAME} failed${NC}"
    echo -e "${YELLOW}📋 Checking stack events...${NC}"
    aws cloudformation describe-stack-events \
        --stack-name $STACK_NAME \
        --region $AWS_REGION \
        --max-items 10 \
        --query 'StackEvents[].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
        --output table
    exit 1
fi

echo
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo "Next steps:"
echo "1. Upload your Lambda function code to the S3 bucket"
echo "2. Update your frontend with the new API Gateway URL"
echo "3. Test the application"</content>
<parameter name="filePath">/Users/stevenbrown/Budget/deploy.sh