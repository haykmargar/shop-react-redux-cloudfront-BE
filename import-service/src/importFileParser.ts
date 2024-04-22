import AWS from 'aws-sdk';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import { winstonLogger } from './utils/logger';
import { errorResponse } from './utils/apiResponseBuilder';
import { S3Event } from 'aws-lambda';

const s3 = new AWS.S3();

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
    readableStream
      .pipe(csvParser())
      .on('data', (data) => records.push(data))
      .on('end', async () => {
        winstonLogger.logRequest(`Parsed records: ${records}`);

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
    winstonLogger.logError(`Error: ${error}`);
    return errorResponse(error, 500);
  }
};
