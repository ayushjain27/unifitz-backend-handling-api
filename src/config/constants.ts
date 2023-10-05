import config from 'config';
import {
  S3Config,
  SurepassConfig,
  TwilioConfig,
  TwoFactorConfig
} from '../interfaces/config.interface';

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

export const twoFactorConfig: TwoFactorConfig = {
  URL: config.get('2FACTOR_API_URL'),
  API_KEY: config.get('2FACTOR_API_KEY'),
  TEMPLATE_NAME: config.get('2FACTOR_TEMPLATE_NAME')
};

export const surepassConfig: SurepassConfig = {
  URL: config.get('SUREPASS_URL'),
  API_KEY: config.get('SUREPASS_API_KEY')
};

export const testUsers = [
  { phoneNo: '7777777777', role: 'STORE_OWNER', otp: '7777' },
  { phoneNo: '9999999999', role: 'USER', otp: '9999' }
];
