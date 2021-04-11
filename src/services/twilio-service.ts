import { Twilio } from 'twilio';
import config from 'config';

class TwilioService {
  private client: Twilio;
  private readonly twilioServiceId: string = config.get('SERVICE_ID');
  constructor(accountId: string, authToken: string) {
    this.client = new Twilio(accountId, authToken);
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

const twilioCLient = new TwilioService(
  config.get('ACCOUNT_SID'),
  config.get('AUTH_TOKEN')
);
export default twilioCLient;
