import products from './mocks/products-data.json';
import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

export const getProductsListHandler = () => async (event: APIGatewayProxyEvent, _context: Context) => {
    const productsData = products;

    try {
        return successResponse(productsData);
    } catch (err) {
        return  errorResponse(err);
    }
}
