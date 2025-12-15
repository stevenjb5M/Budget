import { APIGatewayProxyEvent } from 'aws-lambda';

export interface AuthContext {
  userId: string;
  claims: Record<string, unknown>;
}

export const extractUserFromEvent = (event: APIGatewayProxyEvent): string | null => {
  // Extract from Cognito authorizer context
  const authorizer = event.requestContext.authorizer as Record<string, unknown> | undefined;
  
  if (authorizer && typeof authorizer.claims === 'object' && authorizer.claims !== null) {
    const claims = authorizer.claims as Record<string, unknown>;
    return claims['sub'] as string || null;
  }

  return null;
};

export const validateAuthorization = (event: APIGatewayProxyEvent): string | null => {
  const userId = extractUserFromEvent(event);
  return userId;
};
