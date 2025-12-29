import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getUserHandler, updateUserHandler, createUserHandler, getUserVersionsHandler } from './handlers/users';
import { errorResponse } from './utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from './constants';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const httpMethod = event.httpMethod;
    const path = event.path;

    // Handle OPTIONS for all paths
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

    // Route to /api/users/versions
    if (path.includes('/versions')) {
      if (httpMethod === 'GET') {
        return await getUserVersionsHandler(event);
      }
    }

    // Route to /api/users/me
    if (path.includes('/me')) {
      switch (httpMethod) {
        case 'GET':
          return await getUserHandler(event);
        case 'PUT':
          return await updateUserHandler(event);
        default:
          return errorResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, ERROR_MESSAGES.METHOD_NOT_ALLOWED);
      }
    }

    // Default routes for /api/users
    switch (httpMethod) {
      case 'GET':
        return await getUserHandler(event);
      case 'PUT':
        return await updateUserHandler(event);
      case 'POST':
        return await createUserHandler(event);
      default:
        return errorResponse(HTTP_STATUS.METHOD_NOT_ALLOWED, ERROR_MESSAGES.METHOD_NOT_ALLOWED);
    }
  } catch (error) {
    console.error('Error in users handler:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
