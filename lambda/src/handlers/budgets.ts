import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dynamodbService from '../services/dynamodbService';
import { validateAuthorization } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const getBudgetsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Get all budgets for the user
    const budgets = await dynamodbService.getUserBudgets(userId);
    return successResponse(budgets);
  } catch (error) {
    console.error('Error getting budgets:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const createBudgetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = parseBody(event.body);
    
    const validation = validateRequiredFields(body, [
      'planId',
      'name',
      'amount',
    ]);

    if (!validation.valid) {
      return errorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        { missingFields: validation.missingFields }
      );
    }

    const budget = await dynamodbService.createBudget({
      planId: body.planId as string,
      userId,
      name: body.name as string,
      amount: body.amount as number,
      spent: 0,
    });

    return successResponse(budget, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating budget:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const updateBudgetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const budgetId = event.pathParameters?.id;
    if (!budgetId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Budget ID is required');
    }

    const existingBudget = await dynamodbService.getBudget(budgetId);
    if (!existingBudget || existingBudget.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.BUDGET_NOT_FOUND);
    }

    const body = parseBody(event.body);
    delete (body as any).id;
    delete (body as any).planId;
    delete (body as any).userId;
    delete (body as any).version;
    delete (body as any).createdAt;

    const budget = await dynamodbService.updateBudget(budgetId, body as any);
    return successResponse(budget);
  } catch (error) {
    console.error('Error updating budget:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const deleteBudgetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const budgetId = event.pathParameters?.id;
    if (!budgetId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Budget ID is required');
    }

    const existingBudget = await dynamodbService.getBudget(budgetId);
    if (!existingBudget || existingBudget.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.BUDGET_NOT_FOUND);
    }

    await dynamodbService.deleteBudget(budgetId);
    return successResponse({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
