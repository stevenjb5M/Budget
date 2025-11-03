# Budget Planner - Development Setup

This document outlines how to set up and run the Budget Planner project locally.

## Project Structure

```
Budget/
├── backend/                 # ASP.NET Core API
│   ├── Models/             # Data models (User, Plan, Budget, Asset, Debt, Transaction)
│   ├── Controllers/        # API endpoints
│   ├── Services/           # Business logic (to be implemented)
│   ├── Config/            # AWS/Cognito configuration
│   ├── Program.cs         # Application startup
│   ├── appsettings.json   # Configuration
│   └── BudgetPlanner.API.csproj
├── frontend/               # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Main app
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS config
├── ProjectDesign.md       # Project design document
└── README.md             # Project overview
```

## Backend Setup (ASP.NET Core)

### Prerequisites
- .NET 8 SDK installed
- Visual Studio or VS Code with C# extension

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Restore NuGet packages:
```bash
dotnet restore
```

3. Build the project:
```bash
dotnet build
```

### Running the Backend

Start the development server:
```bash
dotnet run
```

The API will be available at `http://localhost:5000`

API documentation (Swagger) will be available at `http://localhost:5000/swagger`

### Environment Configuration

Update `appsettings.json` with your AWS Cognito credentials:
```json
{
  "Cognito": {
    "UserPoolId": "your-pool-id",
    "ClientId": "your-client-id",
    "Authority": "https://cognito-idp.us-west-2.amazonaws.com/your-pool-id"
  }
}
```

## Frontend Setup (React + Vite)

### Prerequisites
- Node.js 16+ and npm

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Running the Frontend

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Data Models

### User
- Id: Cognito User ID
- Email: User email
- DisplayName: User display name
- CreatedAt, UpdatedAt: Timestamps

### Plan
- Id: UUID
- UserId: Owner
- Name: Plan name (e.g., "Baseline", "Best Case")
- BudgetIds: References to budgets in the plan
- TransactionIds: References to one-off transactions

### Budget
- Id: UUID
- UserId, PlanId: Owner and optional plan
- Month: The month this budget covers
- IncomeItems: List of income sources with amounts
- ExpenseItems: List of expense categories with amounts
- TotalIncome, TotalExpenses: Calculated totals

### Asset
- Id: UUID
- UserId: Owner
- Name: Account name (e.g., "Emergency Fund")
- CurrentValue: Current balance
- AnnualAPY: Annual Percentage Yield

### Debt
- Id: UUID
- UserId: Owner
- Name: Debt name (e.g., "Student Loan")
- CurrentBalance: Current balance
- AnnualInterestRate: Interest rate as percentage

### Transaction
- Id: UUID
- PlanId: Associated plan
- Name: Description
- Amount: Positive for income, negative for expense
- Month: Month this applies to
- Type: "Income" or "Expense"

## API Endpoints

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile

### Plans
- `GET /api/plans` - Get all plans for user
- `GET /api/plans/{planId}` - Get specific plan
- `POST /api/plans` - Create new plan
- `PUT /api/plans/{planId}` - Update plan
- `DELETE /api/plans/{planId}` - Delete plan

### Budgets
- `GET /api/budgets` - Get all budgets for user
- `GET /api/budgets/{budgetId}` - Get specific budget
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/{budgetId}` - Update budget
- `DELETE /api/budgets/{budgetId}` - Delete budget

### Assets
- `GET /api/assets` - Get all assets for user
- `GET /api/assets/{assetId}` - Get specific asset
- `POST /api/assets` - Create new asset
- `PUT /api/assets/{assetId}` - Update asset
- `DELETE /api/assets/{assetId}` - Delete asset

### Debts
- `GET /api/debts` - Get all debts for user
- `GET /api/debts/{debtId}` - Get specific debt
- `POST /api/debts` - Create new debt
- `PUT /api/debts/{debtId}` - Update debt
- `DELETE /api/debts/{debtId}` - Delete debt

## Next Steps (AWS Setup)

1. Set up Amazon Cognito for authentication
2. Configure DynamoDB tables
3. Deploy backend to AWS Elastic Beanstalk
4. Deploy frontend to AWS S3 + CloudFront
5. Configure environment variables for production

See ProjectDesign.md for the full system architecture.

## Development Notes

- All API endpoints require JWT authentication
- Frontend communicates with backend via REST API
- DynamoDB implementation is still pending
- Service layer for business logic needs to be implemented
