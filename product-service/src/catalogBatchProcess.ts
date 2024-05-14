import { DynamoDB } from 'aws-sdk';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { v4 as uuidv4 } from 'uuid';

const dynamoDb = new DynamoDB.DocumentClient();

export const catalogBatchProcessHandler = async (event, _context) => {
  console.log('Event:', event);

  try {
    for (const record of event.Records) {
      const product = JSON.parse(record.body);
      console.log('Product:', product);

      if (
        !product ||
        !product.title ||
        !product.description ||
        typeof product.price !== 'number' ||
        typeof product.count !== 'number'
      ) {
        return successResponse({ message: 'Invalid product data' }, 400);
      }

      const { title, description, price } = product;
      const count = product.count || 0;
      const id = product.id || uuidv4();

      const productUpsert = {
        TableName: 'productsTable',
        Item: {
          id,
          title,
          description,
          price,
        },
      };

      await dynamoDb.put(productUpsert).promise();

      const stock = {
        TableName: 'stocksTable',
        Item: {
          product_id: id,
          count,
        },
      };

      await dynamoDb.put(stock).promise();
    }
    return successResponse({ message: 'Batch processed successfully.' });
  } catch (err) {
    return errorResponse(err);
  }
};
