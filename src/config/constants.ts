import config from 'config';
import { S3Config, TwilioConfig } from '../interfaces/config.interface';

export const defaultCodeLength = 4;

export const twilioConfig: TwilioConfig = {
  ACC_ID: config.get('ACCOUNT_SID'),
  AUTH_TOKEN: config.get('AUTH_TOKEN'),
  SERVICE_ID: config.get('SERVICE_ID')
};

export const s3Config: S3Config = {
  AWS_KEY_ID: config.get('AWS_KEY_ID'),
  ACCESS_KEY: config.get('ACCESS_KEY'),
  BUCKET_NAME: config.get('BUCKET_NAME')
};
