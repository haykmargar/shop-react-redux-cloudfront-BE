import { errorResponse, successResponse } from './utils/apiResponseBuilder';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import AWS from 'aws-sdk';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';

const dynamoDB = new AWS.DynamoDB();

export const getProductsListHandler = () => async (event: APIGatewayProxyEvent, _context: Context) => {
    try {
        const productsParams = {
            TableName: 'products'
        };
        const productsResult = await dynamoDB.scan(productsParams).promise();
        const productsList = productsResult.Items?.map(item => AWS.DynamoDB.Converter.unmarshall(item));

        const stockParams = {
            TableName: 'stock'
        };
        const stockResult = await dynamoDB.scan(stockParams).promise();
        const stockList = stockResult.Items?.map(item => AWS.DynamoDB.Converter.unmarshall(item));
        const mergedList = joinProductsAndStock(productsList, stockList);

        return successResponse(mergedList);
    } catch (err) {
        return  errorResponse(err);
    }
}

const convertDynamoDBItems = (items: AttributeMap[]) => {
    return items.map(item => {
        return Object.entries(item).reduce((acc, [key, value]) => {
            acc[key] = value.S || value.N; // Assume string or number values
            return acc;
        }, {});
    });
};

const joinProductsAndStock = (productsList: any[], stockList: any[]) => {
    const stockCountsMap = new Map<string, number>();

    for (const stockItem of stockList) {
        const productId = stockItem.product_id;
        const count = parseInt(stockItem.count, 10);
        stockCountsMap.set(productId, count);
    }

    const mergedList = productsList.map(product => {
        const productId = product.id;
        const stockCount = stockCountsMap.get(productId) || 0;

        return {
            ...product,
            count: stockCount
        };
    });

    return mergedList;
};
