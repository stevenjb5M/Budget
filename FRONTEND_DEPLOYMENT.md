# Frontend Migration & Deployment Guide

## Overview
This guide covers migrating the Budget Planner frontend to S3 + CloudFront and configuring it to use the Lambda API backend.

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# API Endpoints
VITE_API_URL_DEV=http://localhost:5000
VITE_API_URL_PROD=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod

# CloudFront/S3 Configuration
AWS_BUCKET_NAME=budget-app-frontend-prod
AWS_CLOUDFRONT_DIST_ID=E123ABCD456
AWS_REGION=us-east-1
VITE_BASE_PATH=/
```

Use `.env.example` as a template.

## Development

### Local Development with Vite

```bash
cd frontend

# Development server (with API proxy to localhost)
npm run dev

# Build locally
npm run build

# Preview production build
npm run preview

# Run tests
npm run test:run
```

The dev server proxies `/api` requests to `VITE_API_URL` (defaults to `http://localhost:5000`).

## Production Build

### Build for Production

```bash
cd frontend

# Build with production API endpoint
API_URL=https://api-id.execute-api.us-east-1.amazonaws.com/prod npm run build:prod

# Or set in .env file
VITE_API_URL_PROD=https://api-id.execute-api.us-east-1.amazonaws.com/prod
npm run build
```

This creates an optimized `dist/` folder with:
- Minified and chunked JavaScript
- Hashed filenames for cache busting
- Organized asset structure (images, fonts, CSS)
- Source maps for debugging

### Deploy to S3 + CloudFront

#### Option 1: Using Deploy Script

```bash
# Deploy frontend with specific API endpoint
./scripts/deploy-frontend.sh https://api-id.execute-api.us-east-1.amazonaws.com/prod
```

This script:
1. Builds the frontend
2. Syncs HTML files to S3 (no caching)
3. Syncs static assets to S3 (cache for 1 year)
4. Invalidates CloudFront cache
5. Returns CloudFront distribution URL

#### Option 2: Manual Deployment

```bash
# Build frontend
cd frontend
API_URL=https://api-id.execute-api.us-east-1.amazonaws.com/prod npm run build

# Upload to S3
aws s3 sync dist s3://budget-app-frontend-prod --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E123ABCD456 --paths "/*"
```

## Frontend-to-API Communication

### API Configuration

The API client automatically:
1. Detects environment (dev vs prod)
2. Selects appropriate API endpoint
3. Adds authentication tokens from AWS Cognito
4. Handles errors and retries

**File:** `src/api/client.ts`

#### Environment-Based URLs

- **Development:** Uses `VITE_API_URL_DEV` or localhost
- **Production:** Uses `VITE_API_URL_PROD` from build time

### API Endpoints

All endpoints are relative to the API base URL:

```
GET    /api/users/me
GET    /api/plans
POST   /api/plans
GET    /api/plans/{id}
PUT    /api/plans/{id}
DELETE /api/plans/{id}

GET    /api/budgets
POST   /api/budgets
GET    /api/budgets/{id}
PUT    /api/budgets/{id}
DELETE /api/budgets/{id}

GET    /api/assets
POST   /api/assets
GET    /api/assets/{id}
PUT    /api/assets/{id}
DELETE /api/assets/{id}

GET    /api/debts
POST   /api/debts
GET    /api/debts/{id}
PUT    /api/debts/{id}
DELETE /api/debts/{id}
```

## Asset Management

### Caching Strategy

**HTML Files:** No caching (`Cache-Control: no-cache, no-store, must-revalidate`)
- Updated whenever you deploy
- Always served fresh from S3

**Static Assets:** Long-term caching (`Cache-Control: public, max-age=31536000, immutable`)
- Cached for 1 year
- Filenames include content hash (e.g., `main-abc123.js`)
- Safe to update without invalidation

**Automatic Cache Busting:** Vite includes content hashes in filenames
- New content → new filename
- Old caches still valid (older version)
- No need to invalidate old assets

### Asset Organization

```
dist/
├── index.html                    (No cache)
├── assets/
│   ├── css/
│   │   └── main-[hash].css      (1 year cache)
│   ├── js/
│   │   ├── main-[hash].js       (1 year cache)
│   │   └── vendor-[hash].js     (1 year cache)
│   ├── images/
│   │   └── logo-[hash].svg      (1 year cache)
│   └── fonts/
│       └── roboto-[hash].woff2  (1 year cache)
```

## Testing

### Frontend Tests

```bash
cd frontend

# Run all tests
npm run test:run

# Watch mode during development
npm run test

# UI test runner
npm run test:ui

# Coverage report
npm run test:coverage
```

**Test Files:** All components have corresponding `.test.tsx` files
- 246+ tests covering all functionality
- Integration tests for API calls
- Unit tests for utilities and hooks

## Troubleshooting

### API Not Responding

1. Check API endpoint is correct: `VITE_API_URL_PROD`
2. Verify API Gateway is deployed and accepting requests
3. Check CORS headers from Lambda functions
4. Review CloudWatch logs for Lambda errors

### Assets Not Loading

1. Verify S3 bucket is public or CloudFront has access
2. Check CloudFront origin configuration
3. Clear browser cache or use incognito
4. Verify file paths in HTML

### Slow Load Times

1. Check CloudFront distribution settings
2. Enable gzip compression in CloudFront
3. Review network tab in browser DevTools
4. Consider adding CDN caching headers

## Next Steps

1. **Lambda Deployment:** Deploy Lambda functions and API Gateway
2. **S3 Setup:** Create S3 bucket with versioning enabled
3. **CloudFront:** Set up CloudFront distribution with S3 origin
4. **DNS:** Point domain to CloudFront distribution
5. **Testing:** Run end-to-end tests with production environment
6. **Monitoring:** Set up CloudWatch alarms for API and frontend

## Security

### Best Practices

- Store API endpoints in environment variables (not hardcoded)
- Use HTTPS for all API calls (enforced by API Gateway)
- Enable S3 bucket versioning for rollback capability
- Configure S3 bucket policy to block public access (CloudFront only)
- Use IAM roles for deployment scripts (not access keys)
- Enable CloudFront Origin Access Identity (OAI)
- Add security headers via CloudFront

### CORS

Lambda handlers include CORS headers:
```typescript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

Update as needed for your domain.
