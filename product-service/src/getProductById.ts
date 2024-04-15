import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import AWS from 'aws-sdk';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const dynamoDB = new AWS.DynamoDB();

export const getProductByIdHandler = () => async (event: APIGatewayProxyEvent, _context: Context) => {
    try {
        const { productId = '' } = event.pathParameters;
        const params = {
            TableName: 'products',
            Key: {
                'id': { S: productId },
            },
        };

        const productData = await dynamoDB.getItem(params).promise();

        if (!productData.Item) {
            return successResponse(
                { message: `Product with id ${productId} not found` },
                404,
            );
        }

        const product = {
            id: productData.Item.id.S,
            title: productData.Item.title.S,
            description: productData.Item.description.S,
            price: parseFloat(productData.Item.price.N),
            image: parseFloat(productData.Item.image.S),
        };

        return successResponse({ product });
    } catch (err) {
        return errorResponse(err);
    }
};
