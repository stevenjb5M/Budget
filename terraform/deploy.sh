#!/bin/bash
# Deploy Terraform configuration for Budget Planner

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying Budget Planner with Terraform${NC}"

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo -e "${RED}❌ Terraform is not installed${NC}"
    echo "Install from: https://www.terraform.io/downloads.html"
    exit 1
fi

# Initialize Terraform
echo -e "${YELLOW}📦 Initializing Terraform...${NC}"
terraform init

# Validate configuration
echo -e "${YELLOW}🔍 Validating Terraform configuration...${NC}"
terraform validate

# Plan deployment
echo -e "${YELLOW}📋 Planning Terraform deployment...${NC}"
terraform plan -out=tfplan

# Apply deployment
echo -e "${YELLOW}🚀 Applying Terraform deployment...${NC}"
read -p "Do you want to proceed? (yes/no): " -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    terraform apply tfplan
    echo -e "${GREEN}✅ Terraform deployment complete!${NC}"
    
    # Show outputs
    echo -e "${GREEN}📋 Outputs:${NC}"
    terraform output
else
    echo -e "${RED}❌ Deployment cancelled${NC}"
    rm -f tfplan
    exit 1
fi
