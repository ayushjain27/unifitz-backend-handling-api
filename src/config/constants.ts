import config from 'config';
import { TwilioConfig } from '../interfaces/config.interface';

export const defaultCodeLength = 6 | 4;

export const twilioConfig: TwilioConfig = {
  ACC_ID: config.get('ACCOUNT_SID'),
  AUTH_TOKEN: config.get('AUTH_TOKEN'),
  SERVICE_ID: config.get('SERVICE_ID')
};
