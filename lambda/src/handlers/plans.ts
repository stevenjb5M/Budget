import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dynamodbService from '../services/dynamodbService';
import { validateAuthorization } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const getPlansHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const plans = await dynamodbService.getUserPlans(userId);
    return successResponse(plans);
  } catch (error) {
    console.error('Error getting plans:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const getPlanHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const planId = event.pathParameters?.id;
    if (!planId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Plan ID is required');
    }

    const plan = await dynamodbService.getPlan(planId);
    if (!plan || plan.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    }

    return successResponse(plan);
  } catch (error) {
    console.error('Error getting plan:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const createPlanHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = parseBody(event.body);
    
    const validation = validateRequiredFields(body, [
      'name',
    ]);

    if (!validation.valid) {
      return errorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        { missingFields: validation.missingFields }
      );
    }

    const plan = await dynamodbService.createPlan({
      userId,
      name: body.name as string,
      description: (body.description as string) || '',
      isActive: body.isActive !== false,
      months: (body.months as any[]) || [],
    });

    return successResponse(plan, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating plan:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const updatePlanHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const planId = event.pathParameters?.id;
    if (!planId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Plan ID is required');
    }

    const existingPlan = await dynamodbService.getPlan(planId);
    if (!existingPlan || existingPlan.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    }

    const body = parseBody(event.body);
    delete (body as any).id;
    delete (body as any).userId;
    delete (body as any).version;
    delete (body as any).createdAt;

    const plan = await dynamodbService.updatePlan(planId, body as any);
    return successResponse(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const deletePlanHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const planId = event.pathParameters?.id;
    if (!planId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Plan ID is required');
    }

    const existingPlan = await dynamodbService.getPlan(planId);
    if (!existingPlan || existingPlan.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND);
    }

    await dynamodbService.deletePlan(planId);
    return successResponse({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
