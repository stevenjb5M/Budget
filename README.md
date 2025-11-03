# Budget Planner

A modern budgeting web app that helps users plan income, expenses, and savings across multiple months and scenarios.  
Built with **React**, **C# (ASP.NET Core)**, and fully deployed on **AWS**.

---

## Overview

Budget Planner allows users to:
- Create **multiple financial plans** (e.g., baseline, best-case, or reduced income scenarios)
- Define **monthly budgets** with income and expenses
- Track **assets** (savings accounts or investments)
- Adjust future budgets dynamically for long-term planning

This is designed as a **flexible, multi-scenario budgeting tool** for students or families to explore different financial strategies.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React + Vite + TailwindCSS | Responsive, fast UI hosted on AWS S3 + CloudFront |
| **Backend** | ASP.NET Core Web API (C#) | REST API hosted on AWS Elastic Beanstalk |
| **Database** | Amazon DynamoDB | NoSQL JSON-style storage for users, budgets, plans, and assets |
| **Authentication** | Amazon Cognito | Secure user sign-up, login, and JWT-based auth |
| **Hosting** | AWS S3, CloudFront, Elastic Beanstalk, DynamoDB, Cognito | Fully cloud-hosted using AWS free tier |
| **Monitoring** | AWS CloudWatch | Logs and performance metrics |

---

## Data Model

**Main Entities:**
- `User` – authenticated via Cognito
- `Plan` – 3-year timeframe, owned by a user
- `Budget` – monthly budget (income, expenses) tied to a plan
- `Asset` – savings or investment accounts tied to a user

Each entity is stored as a JSON document in DynamoDB.


