import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { s3Config } from '../config/constants';
import Logger from '../config/winston';
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client
} from '@aws-sdk/client-s3';

@injectable()
export class S3Service {
  private client: S3Client;
  private readonly bucketName: string = s3Config.BUCKET_NAME;
  private readonly videoBucketName: string = s3Config.VIDEO_BUCKET_NAME;
  private readonly audioBucketName: string = s3Config.AUDIO_BUCKET_NAME;

  constructor(@inject(TYPES.S3Client) client: S3Client) {
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
    const timeStamp = String(new Date().getTime());
    // const params = {
    //   Bucket: this.bucketName,
    //   Key: `${keySalt}/${timeStamp}/${fileName}`,
    //   Body: fileBuffer,
    //   ACL: 'public-read'
    // };
    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: `${keySalt}/${timeStamp}/${fileName}`,
      Body: fileBuffer,
      ACL: 'public-read'
    };
    Logger.info('---------------------');
    Logger.info('upload file is filereq body is', params);
    Logger.info('---------------------');
    try {
      await this.client.send(new PutObjectCommand(params));
      const location: string = this.getLocation(
        this.bucketName as string,
        params.Key as string
      );

      // const { Location } = await this.client.upload(params).promise();
      return {
        key: params.Key,
        url: location
      };
    } catch (err) {
      Logger.error('err in s3', err);
      throw new Error('There is some problem with file uploading');
    }
  }

  async uploadVideo(
    keySalt: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<{
    key: string;
    url: string;
  }> {
    Logger.info('<Service>:<S3-Service>:<Doc upload starting>');
    const params: PutObjectCommandInput = {
      Bucket: this.videoBucketName,
      Key: `${keySalt}/${fileName}`,
      Body: fileBuffer
      // ACL: 'public-read'
    };
    try {
      await this.client.send(new PutObjectCommand(params));
      const location = this.getLocation(
        this.videoBucketName,
        params.Key as string
      );
      return {
        key: params.Key,
        url: location
      };
    } catch (err) {
      Logger.error('err in s3', err);
      throw new Error('There is some problem with file uploading');
    }
  }

  async uploadAudio(
    keySalt: string,
    fileName: string,
    fileBuffer: Buffer
  ): Promise<{
    key: string;
    url: string;
  }> {
    Logger.info('<Service>:<S3-Service>:<Doc upload starting>');
    const params: PutObjectCommandInput = {
      Bucket: this.audioBucketName,
      Key: `${keySalt}/${fileName}`,
      Body: fileBuffer
    };
    try {
      await this.client.send(new PutObjectCommand(params));
      const location = this.getLocation(
        this.audioBucketName,
        params.Key as string
      );
      return {
        key: params.Key,
        url: location
      };
    } catch (err) {
      Logger.error('err in s3', err);
      throw new Error('There is some problem with file uploading');
    }
  }

  async replaceFile(
    fileKey: string,
    fileBuffer: Buffer
  ): Promise<{
    key: string;
    url: string;
  }> {
    Logger.info('<Service>:<S3-Service>:<Doc upload starting>');
    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
      Key: fileKey,
      Body: fileBuffer,
      ACL: 'public-read'
    };
    Logger.info('---------------------');
    Logger.info('upload file is filereq body is', params);
    Logger.info('---------------------');
    try {
      await this.client.send(new PutObjectCommand(params));
      const location = this.getLocation(this.bucketName, params.Key as string);
      return {
        key: params.Key,
        url: location
      };
    } catch (err) {
      Logger.error('err in s3', err);
      throw new Error('There is some problem with file uploading');
    }
  }
  /* eslint-disable */
  async deleteFile(oldFileKey: string) {
    Logger.info('<Service>:<S3-Service>:<Doc delete starting>');
    const params: DeleteObjectCommandInput = {
      Bucket: this.bucketName,
      Key: oldFileKey
    };
    return await this.client.send(new DeleteObjectCommand(params));
  }
  /* eslint-disable */
  async getFile(fileKey: string) {
    Logger.info('<Service>:<S3-Service>:<Doc get starting>');
    const params: GetObjectCommandInput = {
      Bucket: this.bucketName,
      Key: fileKey
    };
    const response: GetObjectCommandOutput = await this.client.send(
      new GetObjectCommand(params)
    );
    return await response.Body.transformToWebStream();
  }

  private getLocation(bucketName: string, key: string): string {
    return `https://${bucketName}.s3.${s3Config.AWS_REGION}.amazonaws.com/${key}`;
  }
}
