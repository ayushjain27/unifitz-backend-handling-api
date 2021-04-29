import { inject, injectable } from 'inversify';
import { S3 } from 'aws-sdk';

import { TYPES } from '../config/inversify.types';
import { s3Config } from '../config/constants';
import Logger from '../config/winston';
import { String } from 'aws-sdk/clients/appstream';

@injectable()
export class S3Service {
  private client: S3;
  private readonly bucketName: string = s3Config.BUCKET_NAME;
  constructor(@inject(TYPES.S3Client) client: S3) {
    this.client = client;
  }
  /* eslint-disable */
  async uploadFile(
    storeId: string,
    fileName: string,
    base64EncodedFile: Buffer,
    fileExtension: String
  ) {
    Logger.info('<Service>:<S3-Service>:<Doc upload starting>');
    const params = {
      Bucket: this.bucketName,
      Key: `${storeId}-${fileName}.${fileExtension}`,
      Body: base64EncodedFile
    };
    return await this.client.upload(params).promise();
  }
}
