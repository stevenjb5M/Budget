import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import dynamodbService from '../services/dynamodbService';
import { validateAuthorization } from '../middleware/auth';
import { successResponse, errorResponse, parseBody, validateRequiredFields } from '../utils/response';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export const getAssetsHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const assets = await dynamodbService.getUserAssets(userId);
    return successResponse(assets);
  } catch (error) {
    console.error('Error getting assets:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const createAssetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const body = parseBody(event.body);
    
    const validation = validateRequiredFields(body, [
      'name',
      'currentValue',
      'annualAPY',
    ]);

    if (!validation.valid) {
      return errorResponse(
        HTTP_STATUS.BAD_REQUEST,
        ERROR_MESSAGES.MISSING_REQUIRED_FIELDS,
        { missingFields: validation.missingFields }
      );
    }

    const asset = await dynamodbService.createAsset({
      userId,
      name: body.name as string,
      currentValue: body.currentValue as number,
      annualAPY: body.annualAPY as number,
      notes: (body.notes as string) || undefined,
    });

    return successResponse(asset, HTTP_STATUS.CREATED);
  } catch (error) {
    console.error('Error creating asset:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const updateAssetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const assetId = event.pathParameters?.id;
    if (!assetId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Asset ID is required');
    }

    const existingAsset = await dynamodbService.getAsset(assetId);
    if (!existingAsset || existingAsset.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ASSET_NOT_FOUND);
    }

    const body = parseBody(event.body);
    delete (body as any).id;
    delete (body as any).userId;
    delete (body as any).version;
    delete (body as any).createdAt;

    const asset = await dynamodbService.updateAsset(assetId, body as any);
    return successResponse(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};

export const deleteAssetHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = validateAuthorization(event);
    if (!userId) {
      return errorResponse(HTTP_STATUS.UNAUTHORIZED, ERROR_MESSAGES.UNAUTHORIZED);
    }

    const assetId = event.pathParameters?.id;
    if (!assetId) {
      return errorResponse(HTTP_STATUS.BAD_REQUEST, 'Asset ID is required');
    }

    const existingAsset = await dynamodbService.getAsset(assetId);
    if (!existingAsset || existingAsset.userId !== userId) {
      return errorResponse(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.ASSET_NOT_FOUND);
    }

    await dynamodbService.deleteAsset(assetId);
    return successResponse({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return errorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_MESSAGES.INTERNAL_ERROR);
  }
};
