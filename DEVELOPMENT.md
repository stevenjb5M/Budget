# Development Workflow

This guide describes how to develop the Budget Planner project.

## Development Environment

### Backend (ASP.NET Core)
- IDE: Visual Studio 2022 or VS Code with C# Dev Kit
- Framework: .NET 8
- Database: DynamoDB (with local development support)

### Frontend (React)
- IDE: VS Code
- Node.js: 16+
- Package Manager: npm

## Git Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature branches
- `bugfix/*` - Bug fix branches
- `docs/*` - Documentation updates

### Commit Messages
Use conventional commits:
```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add or update tests
chore: Maintenance tasks
```

## Development Checklist

### Before Starting
- [ ] Pull latest from `develop`
- [ ] Create feature branch: `git checkout -b feature/feature-name`
- [ ] Install dependencies if needed

### During Development
- [ ] Keep commits focused and atomic
- [ ] Write descriptive commit messages
- [ ] Test changes locally
- [ ] Follow code style conventions

### Before Pushing
- [ ] Ensure code compiles/runs without errors
- [ ] Test your changes
- [ ] Update documentation if needed
- [ ] Rebase on latest `develop` if needed

### Pushing Changes
```bash
git push origin feature/feature-name
```

Then create a Pull Request on GitHub.

## Local Development Tasks

### Starting Both Services

**Terminal 1 - Backend:**
```bash
cd backend
dotnet run
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Then open http://localhost:5173

### Building

**Backend:**
```bash
cd backend
dotnet build
```

**Frontend:**
```bash
cd frontend
npm run build
```

### Linting & Formatting

**Backend (using Rider or VS Code):**
- Use IDE's built-in code formatting

**Frontend:**
```bash
cd frontend
npm run lint
```

## Testing

### Backend
```bash
cd backend
dotnet test
```

### Frontend
```bash
cd frontend
npm run test
```

## Debugging

### Backend
- Set breakpoints in Visual Studio or VS Code
- Run with debugger attached
- Use `dotnet watch run` for hot reload

### Frontend
- Use Chrome DevTools
- Set breakpoints in VS Code debugger
- `npm run dev` includes hot module replacement

## Common Issues

### Port Already in Use
If port 5000 (backend) or 5173 (frontend) is already in use:

**Backend:**
```bash
cd backend
dotnet run --urls "http://localhost:5001"
```

Then update frontend API proxy in `vite.config.ts`

**Frontend:**
```bash
cd frontend
npm run dev -- --port 5174
```

### Missing Dependencies
```bash
# Backend
cd backend
dotnet restore

# Frontend
cd frontend
npm install
```

### Clear Cache
```bash
# Backend
cd backend
rm -rf bin obj

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Environment Variables

Create `.env` files for sensitive configuration:

**backend/.env** (not committed to git):
```
AWS_REGION=us-west-2
COGNITO_USER_POOL_ID=...
COGNITO_CLIENT_ID=...
```

**frontend/.env** (not committed to git):
```
VITE_API_URL=http://localhost:5000
```

## Code Style Guidelines

### C# (.NET)
- Use PascalCase for class and method names
- Use camelCase for local variables and parameters
- Use meaningful names, avoid abbreviations
- Add XML comments to public members

### TypeScript/React
- Use camelCase for function and variable names
- Use PascalCase for component names
- Use meaningful names
- Add JSDoc comments for complex functions
- Use functional components with hooks

## Documentation

- Update SETUP.md when changing project structure
- Update API endpoints in SETUP.md when adding routes
- Keep README.md current with project status
- Add comments for complex logic

## Resources

- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [React Documentation](https://react.dev/)
- [AWS SDK for .NET](https://docs.aws.amazon.com/sdk-for-net/)
- [Vite Documentation](https://vitejs.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
