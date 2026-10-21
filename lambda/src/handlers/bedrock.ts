import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { validateAuthorization } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

// Claude Haiku 5.5 via Claude in Amazon Bedrock (bedrock-mantle endpoint)
export const MODEL_ID = 'anthropic.claude-haiku-5-5';

// API Gateway caps requests at 29s, so keep the model call well under that
const bedrockClient = new AnthropicBedrockMantle({
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  timeout: 25_000,
  maxRetries: 1,
});

const SYSTEM_PROMPT = `You are a friendly, practical financial advisor reviewing a person's monthly budget.
Give specific, actionable feedback grounded in the numbers you are given. Be encouraging but realistic.
Return 2-3 improvements, 1-2 strengths, and a 1-2 sentence summary.`;

export const BudgetFeedbackSchema = z.object({
  improvements: z.array(z.string()),
  strengths: z.array(z.string()),
  summary: z.string(),
});

export type BudgetFeedback = z.infer<typeof BudgetFeedbackSchema>;

interface BudgetFeedbackRequest {
  budgetId?: string;
  budgetName: string;
  income: Array<{ name: string; amount: number; category: string }>;
  expenses: Array<{ name: string; amount: number; category: string }>;
  totalIncome: number;
  totalExpenses: number;
}

export const getBudgetFeedbackHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = parseBody(event.body);

    // totalIncome/totalExpenses can legitimately be 0, so check presence rather than truthiness
    const validation = validateRequiredFields(body, ['budgetName', 'income', 'expenses']);
    const missingFields = [
      ...validation.missingFields,
      ...['totalIncome', 'totalExpenses'].filter((field) => typeof body[field] !== 'number'),
    ];

    if (missingFields.length > 0) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS, {
        missingFields,
      });
    }

    const request = body as unknown as BudgetFeedbackRequest;
    const feedback = await callClaude(generateBudgetPrompt(request));

    return successResponse(feedback);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error('Bedrock API error:', { status: error.status, requestId: error.requestID, message: error.message });
    } else {
      console.error('Error getting budget feedback:', error);
    }
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.AI_FEEDBACK_FAILED);
  }
};

export function generateBudgetPrompt(request: BudgetFeedbackRequest): string {
  const incomeDetails = request.income
    .map((i) => `  - ${i.name} (${i.category}): $${i.amount}`)
    .join('\n');

  const expenseDetails = request.expenses
    .map((e) => `  - ${e.name} (${e.category}): $${e.amount}`)
    .join('\n');

  const savingsRate = request.totalIncome > 0
    ? (((request.totalIncome - request.totalExpenses) / request.totalIncome) * 100).toFixed(1)
    : 0;

  return `Budget: "${request.budgetName}"
Total Monthly Income: $${request.totalIncome}
Total Monthly Expenses: $${request.totalExpenses}
Savings Rate: ${savingsRate}%

Income Sources:
${incomeDetails || '  None'}

Expenses:
${expenseDetails || '  None'}`;
}

async function callClaude(prompt: string): Promise<BudgetFeedback> {
  const response = await bedrockClient.messages.parse({
    model: MODEL_ID,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    output_config: { effort: 'low', format: zodOutputFormat(BudgetFeedbackSchema) },
    messages: [{ role: 'user', content: prompt }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error(`Model refused request: ${response.stop_details?.category ?? 'unknown'}`);
  }
  if (!response.parsed_output) {
    throw new Error(`Model returned no structured output (stop_reason: ${response.stop_reason})`);
  }

  console.log('Bedrock usage:', JSON.stringify(response.usage));

  const { improvements, strengths, summary } = response.parsed_output;
  return {
    improvements: improvements.slice(0, 3),
    strengths: strengths.slice(0, 2),
    summary,
  };
}
