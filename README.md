# Budget Planner

A modern budgeting web app that helps users plan income, expenses, and savings across multiple months and scenarios.  
Built with **React**, **C# (ASP.NET Core)**, and fully deployed on **AWS**.

## Overview

Budget Planner allows users to:
- Create **multiple financial plans** (e.g., baseline, best-case, or reduced income scenarios)
- Define **monthly budgets** with income and expenses
- Track **assets** (savings accounts or investments) and **debts** (loans, credit cards)
- Add **one-off transactions** (bonuses, unexpected expenses)
- Visualize financial projections for 36 months

This is designed as a **flexible, multi-scenario budgeting tool** for students and families to explore different financial strategies.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React + Vite + TailwindCSS | Responsive, fast UI hosted on AWS Amplify |
| **Backend** | ASP.NET Core Web API (C#) | REST API hosted on AWS Elastic Beanstalk |
| **Database** | Amazon DynamoDB | NoSQL JSON-style storage |
| **Authentication** | Amazon Cognito | Secure user sign-up, login, JWT-based auth |
| **Hosting** | AWS Amplify, EB, DynamoDB, Cognito | Fully cloud-hosted on AWS |
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

### Backend Setup
```bash
cd backend
dotnet restore
dotnet run
```
Backend runs on http://localhost:5000

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on http://localhost:5173

For detailed deployment options, see [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md), [AMPLIFY_SETUP.md](AMPLIFY_SETUP.md), or [ELASTIC_BEANSTALK_DEPLOYMENT.md](ELASTIC_BEANSTALK_DEPLOYMENT.md).

## Project Structure

```
Budget/
├── backend/                    # ASP.NET Core API
│   ├── Models/                # Data models
│   ├── Controllers/           # API endpoints
│   ├── Services/              # Business logic
│   ├── Program.cs             # Configuration
│   └── BudgetPlanner.API.csproj
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
├── amplify/                    # AWS Amplify configuration
├── scripts/                    # Database & utility scripts
├── ProjectDesign.md            # Project design & architecture
├── DEPLOYMENT_SUMMARY.md       # Deployment overview
├── AMPLIFY_SETUP.md            # AWS Amplify setup
├── ELASTIC_BEANSTALK_DEPLOYMENT.md  # EB deployment guide
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
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) – Deployment overview and architecture
- [AMPLIFY_SETUP.md](AMPLIFY_SETUP.md) – AWS Amplify backend setup and configuration
- [ELASTIC_BEANSTALK_DEPLOYMENT.md](ELASTIC_BEANSTALK_DEPLOYMENT.md) – Elastic Beanstalk API deployment guide

## Project Status

Budget Planner is a budgeting application with:
- ✅ Complete backend API with user authentication and data management
- ✅ Responsive React frontend with budget visualization
- ✅ AWS cloud deployment (Amplify, Elastic Beanstalk, DynamoDB, Cognito)
- ✅ Version-based synchronization for offline support
- ✅ Multi-scenario financial planning

## License

This project is open source and available under the MIT License.

## Contact

Created by Steven Brown (stevenjb5M)

For questions or feedback, open an issue on GitHub.


