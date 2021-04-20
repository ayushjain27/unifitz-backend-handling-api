import { Twilio } from 'twilio';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/inversify.types';
import { twilioConfig } from '../config/constants';

@injectable()
export class TwilioService {
  private client: Twilio;
  private readonly twilioServiceId: string = twilioConfig.SERVICE_ID;
  constructor(@inject(TYPES.Twilio) client: Twilio) {
    this.client = client;
  }

  async sendVerificationCode(phoneNumber: string, channel: string) {
    return await this.client.verify
      .services(this.twilioServiceId)
      .verifications.create({
        to: `+${phoneNumber}`,
        channel: !channel ? 'sms' : channel
      });
  }

  async verifyCode(phoneNumber: string, code: string) {
    return await this.client.verify
      .services(this.twilioServiceId)
      .verificationChecks.create({
        to: `+${phoneNumber}`,
        code: code
      });
  }
}
