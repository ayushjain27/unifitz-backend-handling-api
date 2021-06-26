import { inject, injectable } from 'inversify';
import { S3 } from 'aws-sdk';
import { TYPES } from '../config/inversify.types';
import { s3Config } from '../config/constants';
import Logger from '../config/winston';

@injectable()
export class S3Service {
  private client: S3;
  private readonly bucketName: string = s3Config.BUCKET_NAME;
  constructor(@inject(TYPES.S3Client) client: S3) {
    this.client = client;
  }
  async uploadFile(
    keySalt: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<{
    key: string;
    url: string;
  }> {
    Logger.info('<Service>:<S3-Service>:<Doc upload starting>');
    const params = {
      Bucket: this.bucketName,
      Key: `${keySalt}-${new Date().getTime()}-${fileName}`,
      Body: fileBuffer,
      ACL: 'public-read'
    };
    Logger.info('---------------------');
    Logger.info('upload file is filereq body is', params);
    Logger.info('---------------------');
    try {
      const { Location } = await this.client.upload(params).promise();
      return {
        key: params.Key,
        url: Location
      };
    } catch (err) {
      Logger.error('err in s3', err);
      throw new Error('There is some problem with file uploading');
    }
  }
  /* eslint-disable */
  async deleteFile(oldFileKey: string) {
    Logger.info('<Service>:<S3-Service>:<Doc delete starting>');
    const params = {
      Bucket: this.bucketName,
      Key: oldFileKey
    };
    return await this.client.deleteObject(params).promise();
  }
  /* eslint-disable */
  async getFile(fileKey: string) {
    Logger.info('<Service>:<S3-Service>:<Doc get starting>');
    const params = {
      Bucket: this.bucketName,
      Key: fileKey
    };
    return await this.client.getObject(params).promise();
  }
}
