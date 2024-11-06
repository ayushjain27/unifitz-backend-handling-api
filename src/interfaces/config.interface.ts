export interface TwilioConfig {
  ACC_ID: string;
  AUTH_TOKEN: string;
  SERVICE_ID: string;
}
export interface S3Config {
  AWS_KEY_ID: string;
  ACCESS_KEY: string;
  BUCKET_NAME: string;
  VIDEO_BUCKET_NAME: string;
  AWS_REGION: string;
}
export interface SQSConfig {
  AWS_KEY_ID: string;
  ACCESS_KEY: string;
  AWS_REGION: string;
  QUEUE_URL: string;
}

export interface TwoFactorConfig {
  URL: string;
  API_KEY: string;
  TEMPLATE_NAME: string;
}

export interface SurepassConfig {
  URL: string;
  API_KEY: string;
}
