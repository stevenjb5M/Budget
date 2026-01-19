import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockRuntime } from '@aws-sdk/client-bedrock-runtime';
import { validateAuthorization } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

const bedrockClient = new BedrockRuntime({
  region: process.env.AWS_REGION || 'us-east-1',
});

// Bedrock free tier: 100K tokens per month (Claude 3.5 Haiku)
// Using Haiku for cost efficiency - ~3k tokens per request average
const MODEL_ID = 'anthropic.claude-3-5-haiku-20241022-v1:0';

interface BudgetFeedbackRequest {
  budgetId?: string;
  budgetName: string;
  income: Array<{ name: string; amount: number; category: string }>;
  expenses: Array<{ name: string; amount: number; category: string }>;
  totalIncome: number;
  totalExpenses: number;
}

interface BudgetFeedback {
  improvements: string[];
  strengths: string[];
  summary: string;
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

    const validation = validateRequiredFields(body, [
      'budgetName',
      'income',
      'expenses',
      'totalIncome',
      'totalExpenses',
    ]);

    if (!validation.valid) {
      return errorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        { missingFields: validation.missingFields }
      );
    }

    const request = body as unknown as BudgetFeedbackRequest;

    // Create prompt for Claude
    const prompt = generateBudgetPrompt(request);

    // Call Bedrock API
    const feedback = await callBedrock(prompt);

    return successResponse(feedback);
  } catch (error) {
    console.error('Error getting budget feedback:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

function generateBudgetPrompt(request: BudgetFeedbackRequest): string {
  const incomeDetails = request.income
    .map((i) => `  - ${i.name} (${i.category}): $${i.amount}`)
    .join('\n');

  const expenseDetails = request.expenses
    .map((e) => `  - ${e.name} (${e.category}): $${e.amount}`)
    .join('\n');

  const savingsRate = request.totalIncome > 0
    ? (((request.totalIncome - request.totalExpenses) / request.totalIncome) * 100).toFixed(1)
    : 0;

  return `You are a financial advisor analyzing a personal budget. Provide helpful, concise feedback.

Budget: "${request.budgetName}"
Total Monthly Income: $${request.totalIncome}
Total Monthly Expenses: $${request.totalExpenses}
Savings Rate: ${savingsRate}%

Income Sources:
${incomeDetails || '  None'}

Expenses:
${expenseDetails || '  None'}

Please provide:
1. 2-3 specific, actionable suggestions for improvement (format as bullet points with "-")
2. 1-2 things they are doing well (format as bullet points with "-")
3. A brief summary (1-2 sentences)

Format your response with clear sections using "Improvements:", "Strengths:", and "Summary:" headers.
Be encouraging but realistic. Focus on practical changes they can make.`;
}

async function callBedrock(prompt: string): Promise<BudgetFeedback> {
  try {
    const response = await bedrockClient.invokeModel({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-06-01',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;

    // Parse the response into structured feedback
    return parseBedrockResponse(content);
  } catch (error) {
    console.error('Bedrock API error:', error);
    throw error;
  }
}

function parseBedrockResponse(content: string): BudgetFeedback {
  // Split response into sections
  const lines = content.split('\n').filter((line) => line.trim());

  const improvements: string[] = [];
  const strengths: string[] = [];
  let summary = '';
  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    const lowerLine = trimmedLine.toLowerCase();

    if (lowerLine.includes('improvement') && lowerLine.includes(':')) {
      currentSection = 'improvements';
      continue;
    }

    if ((lowerLine.includes('strength') || lowerLine.includes('doing well')) && lowerLine.includes(':')) {
      currentSection = 'strengths';
      continue;
    }

    if (lowerLine.includes('summary') && lowerLine.includes(':')) {
      currentSection = 'summary';
      continue;
    }

    if ((trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) && (currentSection === 'improvements' || currentSection === 'strengths')) {
      const item = trimmedLine.replace(/^[-•]\s*/, '').trim();
      if (item.length > 0) {
        if (currentSection === 'improvements') {
          improvements.push(item);
        } else if (currentSection === 'strengths') {
          strengths.push(item);
        }
      }
    } else if (currentSection === 'summary' && trimmedLine.length > 0 && !lowerLine.includes(':')) {
      summary += (summary ? ' ' : '') + trimmedLine;
    }
  }

  // Ensure we have reasonable defaults
  if (improvements.length === 0) {
    improvements.push('Review your expense categories to identify optimization opportunities');
    improvements.push('Consider setting spending limits for discretionary expenses');
  }

  if (strengths.length === 0) {
    strengths.push('You are actively tracking your budget');
  }

  if (!summary) {
    summary = 'Your budget shows awareness and structure. Focus on the suggested improvements to optimize your financial health.';
  }

  return {
    improvements: improvements.slice(0, 3),
    strengths: strengths.slice(0, 2),
    summary: summary.substring(0, 300),
  };
}
