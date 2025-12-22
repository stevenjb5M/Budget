import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getDebtsHandler, createDebtHandler, updateDebtHandler, deleteDebtHandler } from './handlers/debts';
import { errorResponse } from './utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const httpMethod = event.httpMethod;

    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
        body: '',
      };
    }

    switch (httpMethod) {
      case 'GET':
        return await getDebtsHandler(event);
      case 'POST':
        return await createDebtHandler(event);
      case 'PUT':
        return await updateDebtHandler(event);
      case 'DELETE':
        return await deleteDebtHandler(event);
      default:
        return errorResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, ERROR_MESSAGES.METHOD_NOT_ALLOWED);
    }
  } catch (error) {
    console.error('Error in debts handler:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
