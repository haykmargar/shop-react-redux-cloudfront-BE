import { APIGatewayAuthorizerResult } from 'aws-lambda';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { APIGatewayTokenAuthorizerEvent } from 'aws-lambda/trigger/api-gateway-authorizer';
import { Context } from 'aws-lambda';

export const basicAuthorizerHandler =
  () => async (event: APIGatewayTokenAuthorizerEvent, _context: Context) => {
    try {
      const authorizationHeader = event.authorizationToken;

      if (!authorizationHeader) {
        successResponse(
          { message: 'Authorization header is not provided' },
          401,
        );
        return generatePolicy('user', 'Deny', event.methodArn);
      }

      const encodedCredentials = authorizationHeader.split(' ')[1];
      const decodedCredentials = Buffer.from(
        encodedCredentials,
        'base64',
      ).toString('utf-8');
      const [username, password] = decodedCredentials.split(':');
      const formattedUsername = username.replace('_', '-');

      const expectedPassword = process.env[formattedUsername];
      if (!expectedPassword || expectedPassword !== password) {
        successResponse({ message: 'Access is denied for this user' }, 403);
        return generatePolicy('user', 'Deny', event.methodArn);
      }

      return generatePolicy(formattedUsername, 'Allow', event.methodArn);
    } catch (error) {
      errorResponse(error, 500);
      throw new Error('Unauthorized');
    }
  };

const generatePolicy = (
  principalId: string,
  effect: string,
  resource: string,
): APIGatewayAuthorizerResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
