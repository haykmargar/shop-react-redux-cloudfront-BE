import AWS from 'aws-sdk';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { winstonLogger } from './utils/logger';
import { errorResponse } from './utils/apiResponseBuilder';
import { S3Event } from 'aws-lambda';

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const sqsQueueUrl = '';

export const importFileParserHandler = () => async (event: S3Event) => {
  try {
    const bucketName = event.Records[0].s3.bucket.name;
    const objectKey = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, ' '),
    );

    if (!objectKey.startsWith('uploaded/')) {
      winstonLogger.logRequest(
        `Skipping file ${objectKey} as it is not in the 'uploaded' folder.`,
      );
      return;
    }

    const s3Object: AWS.S3.GetObjectOutput = await s3
      .getObject({ Bucket: bucketName, Key: objectKey })
      .promise();

    const readableStream = new Readable();
    readableStream._read = () => {};
    readableStream.push(s3Object.Body);
    readableStream.push(null);

    const records = [];
      readableStream.pipe(csvParser())
      .on('data', async (data) => {
          try {
              const params = {
                  QueueUrl: sqsQueueUrl,
                  MessageBody: JSON.stringify(data),
              };
              await sqs.sendMessage(params).promise();
              records.push(data);
              winstonLogger.logRequest(`Sent message to SQS: ${JSON.stringify(data)}`);
          } catch (error) {
              winstonLogger.logError(`Error sending message to SQS: ${error.message}`);
              throw error;
          }
      })
      .on('end', async () => {
        winstonLogger.logRequest(`Parsed records: ${JSON.stringify(records, null, 2)}`);

        const newObjectKey = objectKey.replace('uploaded/', 'parsed/');
        await s3
          .copyObject({
            Bucket: bucketName,
            CopySource: `${bucketName}/${objectKey}`,
            Key: newObjectKey,
          })
          .promise();
        await s3.deleteObject({ Bucket: bucketName, Key: objectKey }).promise();
        winstonLogger.logRequest(`File ${objectKey} moved to 'parsed' folder.`);
      });
  } catch (error) {
    winstonLogger.logError(`Error: ${error.message}`);
    return errorResponse(error, 500);
  }
};
