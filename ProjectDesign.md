# Budget Planner - Final Project Design

Final Project: https://byu.instructure.com/courses/32608/pages/final-project

---

## Project Purpose & Goals

**Budget Planner** is a modern web application that helps users plan income, expenses, and savings across multiple months and scenarios. 

**Key Features:**
- Create **multiple financial plans** (e.g., baseline, best-case, or reduced income scenarios)
- Define **monthly budgets** with income and expenses
- Track **assets** (savings accounts or investments)
- Adjust future budgets dynamically for long-term planning

This is designed as a **flexible, multi-scenario budgeting tool** for students or families to explore different financial strategies.

---

## Data Model (ERD)

**Main Entities:**
- `User` – authenticated via Amazon Cognito
- `Plan` – 3-year (36 month) financial projection containing:
  - Monthly budgets with income/expenses
  - Net worth calculations for each month
  - Asset value projections for each month
- `PlanMonth` – individual month within a plan containing:
  - Budget assignment for that month
  - Net worth calculation for that month
  - **Transactions** for one-off income/expenses that month
- `Budget` – monthly budget containing:
  - Income sources (salary, freelance, etc.)
  - Expense categories (rent, food, utilities, etc.)
  - Monthly totals and projections
- `Asset` – savings or investment accounts containing:
  - Name (e.g., "Emergency Fund", "Roth IRA")
  - Current cash value
  - Yearly APY (Annual Percentage Yield)
- `Debt` – loans and credit accounts containing:
  - Name (e.g., "Student Loan", "Credit Card", "Car Loan")
  - Current balance (negative value)
  - Yearly interest rate
- `Transaction` – one-off income or expenses for specific months within plans, outside of regular budgets

**Versioning Entities:**
- `UserVersion` – tracks global version numbers for data synchronization:
  - Global version for all user data
  - Separate versions for budgets, plans, assets, debts
  - Last updated timestamp
- `VersionedData` – local storage wrapper (frontend only):
  - Entity data with version number
  - Last modified timestamp
  - Last synced timestamp (optional)
- **Version Fields** – each main entity (Plan, Asset, Budget, Debt) has:
  - `Version` field for optimistic concurrency control
  - `UpdatedAt` timestamp for change tracking

Each entity is stored as a JSON document in DynamoDB with version tracking for optimistic concurrency.

**Versioning Storage:**
- **Backend**: Each entity has `Version` and `UpdatedAt` fields in DynamoDB
- **Backend**: `UserVersion` entity tracks global versions per user
- **Frontend**: `VersionedData` wrapper adds localStorage metadata (last synced, etc.)
- **Frontend**: `SyncMetadata` tracks sync state and pending changes

**Relationships:**
- User → Plans (1:many)
- User → Assets (1:many)
- User → Debts (1:many)
- User → Budgets (1:many)
- User → UserVersion (1:1)
- Plan → PlanMonths (1:many)
- Plan → Budgets (1:many)
- PlanMonth → Transactions (1:many)
- **Each entity has Version/UpdatedAt fields for optimistic concurrency**

**Versioning Flow:**
1. Frontend stores data locally with version numbers
2. Changes marked as "pending" until synced with backend
3. Backend validates versions before updates (optimistic locking)
4. Successful sync clears pending changes flag
5. Failed sync preserves local changes for retry

---

## System Architecture

**Tech Stack:**
| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React + Vite + TailwindCSS + VersioningService | Responsive UI with offline caching and sync |
| **Backend** | ASP.NET Core Web API (C#) | REST API with version validation |
| **Database** | Amazon DynamoDB | NoSQL storage with optimistic locking |
| **Authentication** | Amazon Cognito | Secure user sign-up, login, JWT-based auth |
| **Local Storage** | Browser LocalStorage | Client-side caching with versioning |
| **Hosting** | AWS Amplify, Elastic Beanstalk, DynamoDB, Cognito | Fully cloud-hosted |
| **Monitoring** | AWS CloudWatch | Logs and performance metrics |

**System Flow:**
1. User signs in via Cognito
2. Frontend loads cached data from localStorage (VersioningService)
3. Frontend syncs with backend API for latest data
4. User makes changes (saved locally first, marked as pending)
5. Changes automatically sync to backend with version conflict resolution
6. Backend validates versions and updates DynamoDB with optimistic locking
7. Frontend updates local cache and clears pending changes flag
8. CloudWatch logs performance and errors

**System Design Diagram:**

```
┌─────────────┐
│    User     │
│  (Browser)  │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐     ┌─────────────────┐
│   React     │◄────┤   Amazon        │
│  Frontend   │     │   Cognito       │
│ (Amplify)   │     │  (Auth/JWT)     │
│             │     └─────────────────┘
│ + Versioning│           ▲
│   Service   │           │ Sync
│ (LocalStorage)│         │
└──────┬──────┘           │
       │ REST API         │
       │ (JWT Auth)       │
       ▼                  │
┌─────────────┐     ┌─────────────────┐
│ ASP.NET     │◄───►│   DynamoDB      │
│ Core API    │     │  (NoSQL DB)     │
│ (EB)        │     │                 │
│             │     │ + UserVersion   │
│ + Version   │     │   tracking      │
│   Validation│     └─────────────────┘
└──────┬──────┘
       │ Logs/Metrics
       ▼
┌─────────────┐
│ CloudWatch  │
│ (Monitoring)│
└─────────────┘
```

**Key Interactions:**
- **User → Cognito**: Authentication (sign up/login)
- **Cognito → React**: JWT tokens for authorized requests
- **React → LocalStorage**: Cache data with versioning (VersioningService)
- **React → ASP.NET**: REST API calls with JWT authentication and version headers
- **ASP.NET → DynamoDB**: CRUD operations with optimistic locking
- **DynamoDB → ASP.NET**: Version validation and conflict resolution
- **ASP.NET → React**: Updated data with new version numbers
- **React → LocalStorage**: Update cache and clear pending changes
- **ASP.NET → CloudWatch**: Logging and monitoring

## Project Timeline (Nov 3 – Dec 10)

| Milestone | Date | Goals |
|-----------|------|-------|
| **Authentication Setup** | Nov 8 | Cognito integration, user sign-up/login working |
| **Frontend Development** | Nov 17 | React UI for plans, budgets, assets; dashboard layout |
| **Integration & Testing** | Nov 26 | Backend-frontend integration complete, API fully functional |
| **Deployment & Polish** | Dec 3 | Deployed to AWS, bug fixes, optimization |
| **Class Ends** | Dec 10 | Final reviews, project complete |

---

## Initial UX Sketch

*(To be added: rough wireframes of dashboard, plan creation, budget editing screens)*

---

## Additional Notes

- Using AWS free tier where possible
- DynamoDB for flexible JSON storage
- React + Vite for fast build/dev experience 


