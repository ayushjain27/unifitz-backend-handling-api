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
    storeId: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<{
    key: string;
    url: string;
  }> {
    Logger.info('<Service>:<S3-Service>:<Doc upload starting>');
    const params = {
      Bucket: this.bucketName,
      Key: `${storeId}-${new Date().getTime()}-${fileName}`,
      Body: fileBuffer,
      ACL: 'public-read'
    };
    console.log("---------------------");
    console.log("upload file is filereq body is", params);
    console.log("---------------------")
    try{
    const { Location } = await this.client.upload(params).promise();
  } catch(err) {
    console.log("err in s3", err);
  }
    return {
      key: params.Key,
      url: Location
    };
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
