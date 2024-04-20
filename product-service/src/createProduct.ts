import AWS from 'aws-sdk';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const dynamoDB: AWS.DynamoDB.DocumentClient = new AWS.DynamoDB.DocumentClient();

export const createProductHandler =
  () => async (event: APIGatewayProxyEvent, _context: Context) => {
    try {
      const productData = JSON.parse(event.body);

      if (
        !productData.id ||
        !productData.title ||
        !productData.description ||
        !productData.price
      ) {
        return successResponse({ message: 'Invalid product data' }, 400);
      }

      const productParams = {
        TableName: 'products',
        Item: {
          id: productData.id,
          title: productData.title,
          description: productData.description,
          price: productData.price,
          image: productData.image,
        },
      };

      const stockParams = {
        TableName: 'stock',
        Item: {
          product_id: productData.id,
          count: 0,
        },
      };

      await dynamoDB
        .batchWrite({
          RequestItems: {
            products: [{ PutRequest: { Item: productParams.Item } }],
            stock: [{ PutRequest: { Item: stockParams.Item } }],
          },
        })
        .promise();

      return successResponse({ message: 'Product created successfully' });
    } catch (error) {
      return errorResponse(error, 500);
    }
  };
