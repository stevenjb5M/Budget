import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';

export interface ApiResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export const createResponse = (
  statusCode: number,
  data: unknown,
  headers?: Record<string, string>
): ApiResponse => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://dbwgrrx6epya7.cloudfront.net',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
    body: JSON.stringify(data),
  };
};

export const errorResponse = (
  statusCode: number,
  message: string,
  details?: Record<string, unknown>
): ApiResponse => {
  return createResponse(statusCode, {
    error: message,
    ...(details && { details }),
  });
};

export const successResponse = (data: unknown, statusCode = HTTP_STATUS.OK): ApiResponse => {
  return createResponse(statusCode, data);
};

export const validateRequiredFields = (
  obj: Record<string, unknown>,
  fields: string[]
): { valid: boolean; missingFields: string[] } => {
  const missingFields = fields.filter((field) => !obj[field]);
  return {
    valid: missingFields.length === 0,
    missingFields,
  };
};

export const parseBody = (body: string | null): Record<string, unknown> => {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new Error('Invalid JSON body');
  }
};
