import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dynamodbService from '../services/dynamodbService';
import { validateAuthorization } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const getDebtsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const debts = await dynamodbService.getUserDebts(userId);
    return successResponse(debts);
  } catch (error) {
    console.error('Error getting debts:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const createDebtHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = parseBody(event.body);
    
    const validation = validateRequiredFields(body, [
      'creditor',
      'amount',
      'interestRate',
      'dueDate',
    ]);

    if (!validation.valid) {
      return errorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        { missingFields: validation.missingFields }
      );
    }

    const debt = await dynamodbService.createDebt({
      userId,
      creditor: body.creditor as string,
      amount: body.amount as number,
      interestRate: body.interestRate as number,
      dueDate: body.dueDate as string,
    });

    return successResponse(debt, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating debt:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const updateDebtHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const debtId = event.pathParameters?.id;
    if (!debtId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Debt ID is required');
    }

    const existingDebt = await dynamodbService.getDebt(debtId);
    if (!existingDebt || existingDebt.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.DEBT_NOT_FOUND);
    }

    const body = parseBody(event.body);
    delete (body as any).id;
    delete (body as any).userId;
    delete (body as any).version;
    delete (body as any).createdAt;

    const debt = await dynamodbService.updateDebt(debtId, body as any);
    return successResponse(debt);
  } catch (error) {
    console.error('Error updating debt:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const deleteDebtHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const debtId = event.pathParameters?.id;
    if (!debtId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Debt ID is required');
    }

    const existingDebt = await dynamodbService.getDebt(debtId);
    if (!existingDebt || existingDebt.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.DEBT_NOT_FOUND);
    }

    await dynamodbService.deleteDebt(debtId);
    return successResponse({ message: 'Debt deleted successfully' });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
