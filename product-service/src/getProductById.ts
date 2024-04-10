import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import products from './mocks/products-data.json';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

export const getProductByIdHandler = () => async (event: APIGatewayProxyEvent, _context: Context) => {
    try {

        const { productId = '' } = event.pathParameters;
        const productsData = products.find(
            (product) => product.id === productId,
        );

        if (!productsData) {
            return successResponse(
                { message: `Product with id ${productId} does not exist` },
                404,
            );
        }

        return successResponse({ productsData });
    } catch (err) {
        return errorResponse(err);
    }
};
