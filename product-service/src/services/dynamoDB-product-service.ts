import AWS from 'aws-sdk';
import productsData from '../mocks/products-data.json';

const credentials = new AWS.SharedIniFileCredentials({ profile: 'Hayko' });
AWS.config.credentials = credentials;

AWS.config.update({ region: 'eu-central-1' });

const dynamoDB = new AWS.DynamoDB();

const populateTables = async () => {
  try {
    await createTable('products', 'id');
    await createTable('stock', 'product_id');

    await waitForTables();

    await populateProductsTable();
    await populateStockTable();
  } catch (error) {
    throw error;
  }
};

const createTable = async (tableName: string, partitionKey: string) => {
  const params = {
    TableName: tableName,
    KeySchema: [{ AttributeName: partitionKey, KeyType: 'HASH' }],
    AttributeDefinitions: [{ AttributeName: partitionKey, AttributeType: 'S' }],
    ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
  };

  await dynamoDB.createTable(params).promise();
};

const waitForTables = async () => {
  await dynamoDB.waitFor('tableExists', { TableName: 'products' }).promise();
  await dynamoDB.waitFor('tableExists', { TableName: 'stock' }).promise();
};

const populateProductsTable = async () => {
  const params = {
    RequestItems: {
      products: productsData.map((product) => ({
        PutRequest: {
          Item: {
            id: { S: product.product.id },
            title: { S: product.product.title },
            description: { S: product.product.description },
            price: { N: String(product.product.price) },
            image: { S: String(product.product.image) },
          },
        },
      })),
    },
  };

  await dynamoDB.batchWriteItem(params).promise();
};

const populateStockTable = async () => {
  const params = {
    RequestItems: {
      stock: productsData.map((product) => ({
        PutRequest: {
          Item: {
            product_id: { S: product.product.id },
            count: { N: String(product.count) },
          },
        },
      })),
    },
  };

  await dynamoDB.batchWriteItem(params).promise();
};

(async () => {
  try {
    await populateTables(); // Wait for populateTables to complete
  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1); // Exit with a non-zero code to indicate failure
  }
})();
