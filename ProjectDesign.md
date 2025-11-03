# 💰 Budget Planner - Final Project Design

Final Project: https://byu.instructure.com/courses/32608/pages/final-project

---

## 📋 Project Purpose & Goals

**Budget Planner** is a modern web application that helps users plan income, expenses, and savings across multiple months and scenarios. 

**Key Features:**
- Create **multiple financial plans** (e.g., baseline, best-case, or reduced income scenarios)
- Define **monthly budgets** with income and expenses
- Track **assets** (savings accounts or investments)
- Adjust future budgets dynamically for long-term planning

This is designed as a **flexible, multi-scenario budgeting tool** for students or families to explore different financial strategies.

---

## 🗂️ Data Model (ERD)

**Main Entities:**
- `User` – authenticated via Amazon Cognito
- `Plan` – 3-year (36 month) financial projection containing:
  - Monthly budgets with income/expenses
  - Net worth calculations for each month
  - Asset value projections for each month
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
- `Transaction` – one-off income or expenses for specific months, outside of regular budgets

Each entity is stored as a JSON document in DynamoDB.

**Relationships:**
- User → Plans (1:many)
- User → Assets (1:many)
- User → Debts (1:many)
- User → Budgets (1:many)
- Plan → Budgets (1:many)
- Plan → Transactions (1:many)

---

## 🏗️ System Architecture

**Tech Stack:**
| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React + Vite + TailwindCSS | Responsive, fast UI hosted on AWS S3 + CloudFront |
| **Backend** | ASP.NET Core Web API (C#) | REST API hosted on AWS Elastic Beanstalk |
| **Database** | Amazon DynamoDB | NoSQL JSON-style storage |
| **Authentication** | Amazon Cognito | Secure user sign-up, login, JWT-based auth |
| **Hosting** | AWS S3, CloudFront, Elastic Beanstalk, DynamoDB, Cognito | Fully cloud-hosted |
| **Monitoring** | AWS CloudWatch | Logs and performance metrics |

**System Flow:**
1. User signs in via Cognito
2. Frontend (React) sends JWT-authenticated requests to ASP.NET Core API
3. Backend queries/updates DynamoDB
4. Frontend displays plan data and budget calculations
5. CloudWatch logs performance and errors

---

## 📅 Project Timeline (Nov 3 – Dec 10)

| Milestone | Date | Goals |
|-----------|------|-------|
| **Authentication Setup** | Nov 8 | Cognito integration, user sign-up/login working |
| **Frontend Development** | Nov 17 | React UI for plans, budgets, assets; dashboard layout |
| **Integration & Testing** | Nov 26 | Backend-frontend integration complete, API fully functional |
| **Deployment & Polish** | Dec 3 | Deployed to AWS, bug fixes, optimization |
| **Class Ends** | Dec 10 | Final reviews, project complete |

---

## 🎨 Initial UX Sketch

*(To be added: rough wireframes of dashboard, plan creation, budget editing screens)*

---

## ✅ Additional Notes

- Using AWS free tier where possible
- DynamoDB for flexible JSON storage
- React + Vite for fast build/dev experience 


