# ECS Fargate Deployment Guide

Your AWS ECS infrastructure is ready! Here's what was created:

## ✅ Infrastructure Created
- **ECS Cluster**: `budget-cluster`
- **Task Definition**: `budget-api` (configured for .NET 9.0)
- **Security Group**: `sg-02b48e257194528e7` (allows HTTP on port 80)
- **ECR Repository**: `180294193745.dkr.ecr.us-east-1.amazonaws.com/budget-api`
- **ECS Service**: `budget-api-service` (running 1 Fargate task)

## ⚠️ Next Step: Deploy Your .NET API

The infrastructure is ready, but we need to deploy your actual .NET code. You have 3 options:

### Option 1: Build Docker Image Locally (Requires Docker)
```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 180294193745.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t budget-api .

# Tag for ECR
docker tag budget-api:latest 180294193745.dkr.ecr.us-east-1.amazonaws.com/budget-api:latest

# Push to ECR
docker push 180294193745.dkr.ecr.us-east-1.amazonaws.com/budget-api:latest

# Update ECS service
aws ecs update-service --cluster budget-cluster --service budget-api-service --force-new-deployment --region us-east-1
```

### Option 2: Use GitHub Actions (Recommended)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to ECS

on:
  push:
    branches: [ dev, main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build, tag, and push image to Amazon ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: budget-api
          IMAGE_TAG: latest
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      
      - name: Update ECS service
        run: |
          aws ecs update-service --cluster budget-cluster --service budget-api-service --force-new-deployment --region us-east-1
```

### Option 3: Use AWS Elastic Beanstalk (Simpler for .NET)
```bash
# Install Elastic Beanstalk CLI
pip install awsebcli

# Initialize EB
eb init -p "Docker" budget-api

# Create and deploy
eb create budget-api-env
eb deploy
```

## Getting the API URL

Once deployed, get the task public IP:
```bash
aws ecs describe-tasks --cluster budget-cluster --tasks $(aws ecs list-tasks --cluster budget-cluster --query taskArns[0] --output text) --region us-east-1 --query 'tasks[0].containerInstanceArn'
```

Or use ECS Console to find the running task's public IP.

## Updating Frontend

Once you have the API URL, update your frontend's API client endpoint and redeploy:
```bash
npx @aws-amplify/cli publish
```

## Costs

- **ECS Fargate**: ~$5-10/month for 512MB/256CPU continuous
- **Data transfer**: Usually free for inter-AWS traffic
- **CloudWatch logs**: ~$0.50/GB stored

You can reduce costs by scheduling the service to stop during off-hours.