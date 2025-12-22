import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getPlansHandler, getPlanHandler, createPlanHandler, updatePlanHandler, deletePlanHandler } from './handlers/plans';
import { errorResponse } from './utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const httpMethod = event.httpMethod;
    const planId = event.pathParameters?.id;

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
        return planId ? await getPlanHandler(event) : await getPlansHandler(event);
      case 'POST':
        return await createPlanHandler(event);
      case 'PUT':
        return await updatePlanHandler(event);
      case 'DELETE':
        return await deletePlanHandler(event);
      default:
        return errorResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, ERROR_MESSAGES.METHOD_NOT_ALLOWED);
    }
  } catch (error) {
    console.error('Error in plans handler:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
