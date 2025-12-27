import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UserService } from '../services/business/userService';
import { validateAuthorization, getUserEmailFromToken, getUserNameFromToken, getUserBirthdateFromToken } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

const userService = new UserService();

export const getUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    let user = await userService.getUser(userId);

    // Auto-create user if they don't exist.
    if (!user) {
      const email = getUserEmailFromToken(event) || 'unknown@example.com';
      const name = getUserNameFromToken(event) || 'User';
      const birthdate = getUserBirthdateFromToken(event) || '1990-01-01';

      user = await userService.createUser({
        displayName: name,
        email: email,
        birthdayString: birthdate,
        retirementAge: 65,
      }, userId);
    }

    return successResponse(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const updateUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = parseBody(event.body);

    const user = await userService.updateUser(userId, body as any);
    return successResponse(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const createUserHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = parseBody(event.body);

    const validation = validateRequiredFields(body, [
      'displayName',
      'email',
    ]);

    if (!validation.valid) {
      return errorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        { missingFields: validation.missingFields }
      );
    }

    const user = await userService.createUser({
      displayName: body.displayName as string,
      email: body.email as string,
      birthdayString: (body.birthdayString as string) || '1990-01-01',
      retirementAge: (body.retirementAge as number) || 65,
    });

    return successResponse(user, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating user:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const getUserVersionsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const userVersion = await userService.getUserVersions(userId);
    
    if (!userVersion) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, 'User versions not found');
    }

    return successResponse(userVersion.data);
  } catch (error) {
    console.error('Error getting user versions:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
