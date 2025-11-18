# Budget Planner - Release Build

This is a production-ready build of the Budget Planner application.

## Contents

- `BudgetPlanner.API` - Self-contained .NET 9.0 backend executable (Linux x64)
- `frontend/` - Built React frontend application
- `deploy.sh` - Deployment script

## Deployment

1. Extract the zip file to your target server
2. Run `./deploy.sh` to start the application
3. The backend will start on port 5000
4. Serve the `frontend/` directory using your preferred web server (nginx, apache, etc.)

## Requirements

- Linux x64 server
- The backend is self-contained and includes all .NET runtime dependencies

## Configuration

Make sure to configure your environment variables for:
- AWS credentials (for DynamoDB)
- Any other API keys or configuration needed

## Stopping the Application

The deployment script will show you the backend process ID. You can stop it with:
```
kill <BACKEND_PID>
```