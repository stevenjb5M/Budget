# Budget Planner

A modern budgeting web app that helps users plan income, expenses, and savings across multiple months and scenarios.  
Built with **React**, **Node.js Lambda**, and fully deployed on **AWS**.

## Overview

Budget Planner allows users to:
- Create **multiple financial plans** (e.g., baseline, best-case, or reduced income scenarios)
- Define **monthly budgets** with income and expenses
- Track **assets** (savings accounts or investments) and **debts** (loans, credit cards)
- Add **one-off transactions** (bonuses, unexpected expenses)
- Visualize financial projections for 36 months

## Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React + Vite + TailwindCSS | Responsive, fast UI hosted on S3 + CloudFront |
| **Backend** | Node.js Lambda Functions | Serverless REST API via API Gateway |
| **Database** | Amazon DynamoDB | NoSQL JSON-style storage |
| **Authentication** | Amazon Cognito | Secure user sign-up, login, JWT-based auth |
| **API Gateway** | AWS API Gateway | REST endpoint with Lambda integration |
| **CDN** | AWS CloudFront | Global content delivery for frontend |
| **Storage** | AWS S3 | Frontend assets and static files |
| **Infrastructure** | Terraform | IaC for AWS resources |
| **Monitoring** | AWS CloudWatch | Logs and performance metrics |

## Versioning & Offline Support

Budget Planner features a **sophisticated version-based synchronization system** for seamless offline functionality and multi-device support:

### Key Features
- **Selective Syncing**: Only downloads changed data based on version numbers (90%+ bandwidth reduction)
- **Offline-First**: App works fully offline with instant loading from local cache
- **Version Tracking**: Each entity (budgets, plans, assets, debts) has individual version numbers
- **Conflict Resolution**: Handles concurrent edits from multiple devices
- **Background Sync**: Automatically syncs changes when back online

### How It Works
- **UserVersion Table**: Tracks global and entity-specific version numbers per user
- **Entity Versions**: Each budget, plan, asset, and debt has its own version counter
- **Smart Caching**: Compares local vs server versions to determine what needs syncing
- **Automatic Updates**: Versions increment on every create/update operation

### Benefits
- ⚡ **Fast Loading**: Instant app startup from local cache
- 📱 **Multi-Device**: Seamless sync across phone, tablet, and desktop
- 🔄 **Reliable Offline**: Full functionality without internet connection
- 📶 **Bandwidth Efficient**: Minimal data transfer through selective syncing

## Quick Start

### Backend (Lambda Functions) Setup
```bash
cd backend
npm install
npm run build
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173 with API proxy to Lambda

### Deployment
For detailed deployment options, see [FRONTEND_DEPLOYMENT.md](FRONTEND_DEPLOYMENT.md) for S3 + CloudFront setup, or [terraform/](terraform/) for infrastructure-as-code documentation.

## Project Structure

```
Budget/
├── backend/                    # Node.js Lambda Functions
│   ├── src/
│   │   ├── handlers/          # Lambda handler functions
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Helper functions
│   │   └── types/             # TypeScript types
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite app
│   ├── src/
│   │   ├── api/              # API client
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.cjs
├── terraform/                  # Infrastructure as Code
│   ├── main.tf               # Main Terraform configuration
│   ├── variables.tf          # Variable definitions
│   ├── outputs.tf            # Output values
│   └── terraform.tfvars      # Variable values
├── scripts/                    # Deployment & utility scripts
│   ├── deploy-frontend.sh    # S3 + CloudFront deployment
│   └── deploy-all.sh         # Full stack deployment
├── ProjectDesign.md            # Project design & architecture
├── FRONTEND_DEPLOYMENT.md      # Frontend deployment guide
└── README.md                   # This file
```

## Data Model

**Entities:**
- **User** – Authenticated via Amazon Cognito
- **Plan** – 36-month financial projection with budgets and transactions
- **Budget** – Monthly budget containing income and expense items
- **Asset** – Savings/investment account (e.g., "Emergency Fund", "Roth IRA")
- **Debt** – Loan or credit account (e.g., "Student Loan", "Credit Card")
- **Transaction** – One-off income/expense for a specific month in a plan

See [ProjectDesign.md](ProjectDesign.md) for full design documentation.

## API Endpoints

All endpoints require JWT authentication via Cognito.

### Users
- `GET /api/users/me` – Get current user
- `PUT /api/users/me` – Update user profile

### Plans
- `GET /api/plans` – Get user's plans
- `POST /api/plans` – Create plan
- `GET /api/plans/{id}` – Get plan details
- `PUT /api/plans/{id}` – Update plan
- `DELETE /api/plans/{id}` – Delete plan

### Budgets
- `GET /api/budgets` – Get user's budgets
- `POST /api/budgets` – Create budget
- `GET /api/budgets/{id}` – Get budget details
- `PUT /api/budgets/{id}` – Update budget
- `DELETE /api/budgets/{id}` – Delete budget

### Assets
- `GET /api/assets` – Get user's assets
- `POST /api/assets` – Create asset
- `GET /api/assets/{id}` – Get asset details
- `PUT /api/assets/{id}` – Update asset
- `DELETE /api/assets/{id}` – Delete asset

### Debts
- `GET /api/debts` – Get user's debts
- `POST /api/debts` – Create debt
- `GET /api/debts/{id}` – Get debt details
- `PUT /api/debts/{id}` – Update debt
- `DELETE /api/debts/{id}` – Delete debt

## Documentation

- [ProjectDesign.md](ProjectDesign.md) – Project design, architecture, and data model
- [FRONTEND_DEPLOYMENT.md](FRONTEND_DEPLOYMENT.md) – Frontend deployment to S3 + CloudFront with caching strategy
- [terraform/](terraform/) – Infrastructure-as-code for Lambda, API Gateway, and supporting services

## Project Status

Budget Planner is a budgeting application with:
- ✅ Complete serverless backend with Lambda and API Gateway
- ✅ Responsive React frontend with budget visualization
- ✅ S3 + CloudFront frontend hosting with optimized caching
- ✅ Infrastructure as Code with Terraform for reproducible deployments
- ✅ Version-based synchronization for offline support
- ✅ Multi-scenario financial planning
- ✅ AWS cloud deployment (Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront)

## License

This project is open source and available under the MIT License.

## Contact

Created by Steven Brown (stevenjb5M)

