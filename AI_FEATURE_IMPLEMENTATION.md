# AI Budget Feedback

Click **"✨ Get AI Feedback"** on the Budgets page and Claude reviews the selected budget, returning
2-3 improvements, 1-2 strengths, and a short summary.

## How it works

```
 Browser (Budgets page)
   │  POST /api/bedrock/feedback  { budgetName, income[], expenses[], totalIncome, totalExpenses }
   ▼
 API Gateway ── Cognito authorizer (JWT required)
   │
   ▼
 Lambda  BudgetPlanner-Bedrock-<env>   (lambda/src/handlers/bedrock.ts)
   │  @anthropic-ai/bedrock-sdk  →  AnthropicBedrockMantle.messages.parse()
   │  model: anthropic.claude-haiku-5-5   effort: low   structured JSON output (zod schema)
   ▼
 Claude in Amazon Bedrock  https://bedrock-mantle.us-east-1.api.aws/anthropic
   │
   ▼
 { improvements: string[], strengths: string[], summary: string }  →  BudgetFeedbackModal
```

- **Structured output**: the response is constrained to the `BudgetFeedbackSchema` JSON schema, so there is no
  free-text parsing.
- **No fake feedback**: if Bedrock errors, refuses, or returns no structured output, the API returns a `500`
  with `"Could not get AI feedback right now. Please try again."` and the modal shows that message.
  It never substitutes canned advice.
- **Abuse protection** (each call costs Bedrock tokens):
  - Sign-up is **invite-only** (Cognito `allow_admin_create_user_only`), so only people you add can call it.
  - **Daily limit**: 20 requests per user per UTC day (`ai_daily_limit`), counted atomically in the
    `BudgetPlanner-AiUsage-<env>` DynamoDB table *before* the model is called. Over the limit → `429`.
  - **Throttling**: API Gateway allows 1 req/s (burst 3) on this route and 20 req/s (burst 40) API-wide.
- **Timeouts**: the SDK call times out at 25s with 1 retry, under API Gateway's 29s limit.
- **Logging**: token usage and Bedrock errors (status + request id) are logged to CloudWatch
  (`/aws/lambda/BudgetPlanner-Bedrock-<env>`).

## AWS setup

1. **Model access**: enable **Claude Haiku 5.5** in the AWS console under
   [Bedrock → Model access](https://console.aws.amazon.com/bedrock/home#/modelaccess) (us-east-1).
2. **IAM**: the Lambda role has `bedrock-mantle:CreateInference` (`terraform/lambda.tf`).

## Deploy

```bash
cd lambda
npm install
npm test
npm run package          # typecheck + esbuild bundle → terraform/lambda-functions.zip
cd ../terraform
terraform apply          # source_code_hash makes Terraform redeploy when the zip changes
```

## Test it

- Unit tests: `lambda/src/handlers/bedrock.test.ts` (Bedrock client mocked).
- Live: sign in, open a budget, click **✨ Get AI Feedback**. Then check CloudWatch for the
  `Bedrock usage:` log line, which confirms a real model call happened.
