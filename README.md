# Budget Planner

A modern budgeting web app that helps users plan income, expenses, and savings across multiple months and scenarios.  
Built with **React**, **Node.js Lambda**, and fully deployed on **AWS**.

## Overview

Budget Planner allows users to:
- Create **multiple financial plans** (e.g., baseline, best-case, or reduced income scenarios)
- Define **monthly budgets** with income and expenses
- Track **assets** (savings accounts or investments) and **debts** (loans, credit cards)
- Add **one-off transactions** (bonuses, unexpected expenses)
- Visualize financial projections for 36 months. Soon to be longer.

## Quick Start Local Setup

**Requirements**: Node.js 20+, npm.

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and connects to the deployed AWS backend. Open your browser and start building!

### Build for Production
```bash
# Optimized Lambda bundle
cd lambda
npm run package    # Typecheck + esbuild bundle → terraform/lambda-functions.zip

# Frontend assets
cd frontend
npm run build      # Creates dist/ for S3 deployment
```

---

---

## Architecture & Features 

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

## Performance Optimizations

The Lambda backend has been optimized for **cost efficiency**, **scalability**, and **fast cold starts**:

### Lambda Bundle Size Reduction
- **Before**: ~39 MB (full `node_modules` included)
- **After**: ~1.3 MB zip (esbuild bundled, each handler self-contained)
- **Reduction**: 99.96% smaller

**How**: `lambda/build.js` uses esbuild to bundle and minify each `src/*-handler.ts` (with its dependencies) into `dist/`.

```bash
cd lambda
npm run build    # Runs esbuild bundler
npm run package  # Creates terraform/lambda-functions.zip
```

### ARM64 Architecture (Graviton2)
- **20% cheaper** than x86_64
- Often faster for Node.js workloads

### Memory Optimization
- **Before**: 256 MB
- **After**: 128 MB
- **Savings**: 50% cost reduction per invocation

128 MB is sufficient for lightweight DynamoDB operations.

### DynamoDB GSI Projection Optimization
To optimize DynamoDB costs at scale, Global Secondary Indexes (GSI) use **KEYS_ONLY** projection instead of ALL:

**Benefits:**
- Reduces storage costs by ~50% (only stores ID and sort keys)
- Faster index scans (smaller index size)
- Maintains same query performance through batch fetching

**How it works:**
1. Query GSI returns only IDs (minimal data transfer)
2. Lambda batch fetches full objects from base table
3. Seamless to client - same API response

**Tables optimized**: Plans, Budgets, Assets, Debts

### Cost Impact Summary

| Optimization | Savings |
|-------------|---------|
| ARM64 Architecture | ~20% |
| 128 MB Memory (vs 256 MB) | ~50% |
| GSI KEYS_ONLY projection | ~50% (at scale) |
| Smaller Bundle (faster deploys) | Indirect |
| **Total Estimated Savings** | **~75%+** (at scale) |

### Cold Start Performance
- Init Duration: ~390 ms (128 MB ARM64)
- Execution Duration: ~3-10 ms for typical requests
- Batch fetch overhead: ~1-2 ms per 25 items

For production with consistent traffic, consider enabling **Provisioned Concurrency** to eliminate cold starts entirely.

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

## Production Deployment

For detailed deployment options, see:
- **Backend + infrastructure**: [terraform/](terraform/) (`npm run package` in `lambda/`, then `terraform apply`)
- **Frontend**: `npm run deploy` from the repo root (`deploy.js` uploads `frontend/dist` to S3 and invalidates CloudFront)

## Project Structure

```
Budget/
├── lambda/                     # Node.js Lambda Functions
│   ├── src/
│   │   ├── handlers/          # Lambda handler functions
│   │   ├── services/          # Business logic (DynamoDB)
│   │   ├── utils/             # Helper functions
│   │   └── types.ts           # TypeScript types
│   ├── build.js               # esbuild bundler script
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
├── deploy.js                   # Frontend S3 + CloudFront deployment
├── AI_FEATURE_IMPLEMENTATION.md # AI budget feedback design
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

- [AI_FEATURE_IMPLEMENTATION.md](AI_FEATURE_IMPLEMENTATION.md) – AI budget feedback (Claude on Amazon Bedrock)
- [terraform/](terraform/) – Infrastructure-as-code for Lambda, API Gateway, and supporting services

## Future Plans

- Integration with Plaid to sync bank account data
- Plans to extend forever

## AI Budget Feedback

Budget Planner includes an **AI-powered budget analysis feature** using Claude Haiku 5.5 on Amazon Bedrock:

- 💡 **Smart Analysis** – Click "✨ Get AI Feedback" to analyze your budget
- 💰 **Actionable Suggestions** – Get 2-3 specific improvement recommendations
- ✅ **Recognize Strengths** – See what you're doing well financially
- 🎯 **Low cost** – Claude Haiku 5.5 with structured JSON output; a typical analysis is a few thousand tokens

The feedback appears in a modal showing a summary, areas for improvement, and financial strengths.

**To deploy and test**: see [AI_FEATURE_IMPLEMENTATION.md](AI_FEATURE_IMPLEMENTATION.md).

## Project Status

Budget Planner is a budgeting application with:
- ✅ Complete serverless backend with Lambda and API Gateway
- ✅ Responsive React frontend with budget visualization
- ✅ S3 + CloudFront frontend hosting with optimized caching
- ✅ Infrastructure as Code with Terraform for reproducible deployments
- ✅ Version-based synchronization for offline support
- ✅ Multi-scenario financial planning
- ✅ AWS cloud deployment (Lambda, API Gateway, DynamoDB, Cognito, S3, CloudFront)
- ✅ Optimized Lambda functions (ARM64, 128MB, esbuild bundling)

## Contact

Created by Steven Brown (stevenjb5M)

