import config from 'config';
import {
  S3Config,
  SQSConfig,
  SurepassConfig,
  TwilioConfig,
  TwoFactorConfig
} from '../interfaces/config.interface';
import { UserRole } from '../enum/user-role.enum';

export const defaultCodeLength = 4;

export const twilioConfig: TwilioConfig = {
  ACC_ID: config.get('ACCOUNT_SID'),
  AUTH_TOKEN: config.get('AUTH_TOKEN'),
  SERVICE_ID: config.get('SERVICE_ID')
};

export const s3Config: S3Config = {
  AWS_KEY_ID: config.get('AWS_KEY_ID'),
  ACCESS_KEY: config.get('ACCESS_KEY'),
  BUCKET_NAME: config.get('BUCKET_NAME'),
  VIDEO_BUCKET_NAME: config.get('VIDEO_BUCKET_NAME'),
  AUDIO_BUCKET_NAME: config.get('AUDIO_BUCKET_NAME'),
  AWS_REGION: config.get('AWS_REGION')
};

export const sqsConfig: SQSConfig = {
  AWS_KEY_ID: config.get('AWS_KEY_ID'),
  ACCESS_KEY: config.get('ACCESS_KEY'),
  AWS_REGION: config.get('AWS_REGION'),
  QUEUE_URL: config.get('QUEUE_URL')
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
  { phoneNo: '7777777777', role: UserRole.STORE_OWNER, otp: '7777' },
  { phoneNo: '9999999999', role: UserRole.USER, otp: '9999' },
  { phoneNo: '3344553455', role: UserRole.STORE_OWNER, otp: '654321' },
  { phoneNo: '3344553455', role: UserRole.USER, otp: '654321' }
];

export const serverkey =
  'AAAAw_xRwT0:APA91bHRGVoe2i4Mnu-2D6ixCDXm9E68WNmYu9SFhx_tsmhgZkOSLr7GWKTOnLnw4pbRAgWLkyaoRLs2dD6LBVI2PvVCHTEkKWl3PQnOFrXkh1DE0ihwcalXx2K9-bm64oINV5xVA2Fz';

export const API_VERSION = config.get('API_VERSION');

export const smcInsuranceKey = config.get('SMC_INSURANCE_API_KEY');

export const razorpayKey = config.get('RAZORPAY_KEY');

export const razorpaySecretId = config.get('RAZORPAY_SECRET_ID');

export const planId = config.get('PLAN_ID');

export const webhookId = config.get('WEBHOOK_ID');
