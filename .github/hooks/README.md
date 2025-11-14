# Pre-commit Hook

A Git pre-commit hook has been set up to automatically run tests before each commit.

## What it does

- Runs frontend tests using `npm run test:run`
- Prevents commits if tests fail
- Shows clear success/failure messages

## Location

The hook is located at: `.git/hooks/pre-commit`

## Behavior

### ✅ Tests Pass
```
🔍 Running tests before commit...
📱 Running frontend tests...
✓ 8 tests passed
✅ All tests passed! Committing...
```

### ❌ Tests Fail
```
🔍 Running tests before commit...
📱 Running frontend tests...
❌ Frontend tests failed. Please fix before committing.
```

## Skipping the Hook

If you need to commit urgently (not recommended):
```bash
git commit --no-verify -m "Your commit message"
```

## Future Backend Tests

When you set up backend tests, uncomment the backend section in the hook:

```bash
# Backend tests
echo "🖥️  Running backend tests..."
cd ../backend
dotnet test
if [ $? -ne 0 ]; then
  echo "❌ Backend tests failed. Please fix before committing."
  exit 1
fi
```

## Benefits

- ✅ Catches bugs before they reach the repository
- ✅ Ensures code quality standards
- ✅ Prevents broken builds
- ✅ Fast feedback (tests run in ~0.5 seconds)