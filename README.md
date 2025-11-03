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
| **Frontend** | React + Vite + TailwindCSS | Responsive, fast UI hosted on AWS S3 + CloudFront |
| **Backend** | ASP.NET Core Web API (C#) | REST API hosted on AWS Elastic Beanstalk |
| **Database** | Amazon DynamoDB | NoSQL JSON-style storage |
| **Authentication** | Amazon Cognito | Secure user sign-up, login, JWT-based auth |
| **Hosting** | AWS S3, CloudFront, EB, DynamoDB, Cognito | Fully cloud-hosted on AWS |
| **Monitoring** | AWS CloudWatch | Logs and performance metrics |

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

See [SETUP.md](SETUP.md) for detailed setup instructions.

## Project Structure

```
Budget/
├── backend/              # ASP.NET Core API
│   ├── Models/          # Data models
│   ├── Controllers/     # API endpoints
│   ├── Services/        # Business logic
│   └── Config/          # Configuration
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── api/        # API client
│   │   ├── components/ # React components
│   │   └── pages/      # Page components
│   └── package.json
├── SETUP.md            # Development setup guide
├── DEVELOPMENT.md      # Development workflow
├── DEPLOYMENT.md       # AWS deployment guide
├── ProjectDesign.md    # Project design & architecture
└── README.md           # This file
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

- [SETUP.md](SETUP.md) – Local development setup
- [DEVELOPMENT.md](DEVELOPMENT.md) – Development workflow and guidelines
- [DEPLOYMENT.md](DEPLOYMENT.md) – AWS deployment instructions
- [ProjectDesign.md](ProjectDesign.md) – Project design and architecture
- [CONTRIBUTING.md](CONTRIBUTING.md) – Contribution guidelines

## Development Timeline

| Milestone | Date | Status |
|-----------|------|--------|
| Authentication Setup | Nov 8 | Not Started |
| Frontend Development | Nov 17 | Not Started |
| Integration & Testing | Nov 26 | Not Started |
| Deployment & Polish | Dec 3 | Not Started |
| Project Complete | Dec 10 | Not Started |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is open source and available under the MIT License.

## Contact

Created by Steven Brown (stevenjb5M)

For questions or feedback, open an issue on GitHub.


