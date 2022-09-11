import { injectable } from 'inversify';
import axios from 'axios';
import { twoFactorConfig } from '../config/constants';

@injectable()
export class TwoFactorService {
  async sendVerificationCode(phoneNumber: string) {
    const url = `${twoFactorConfig.URL}/${twoFactorConfig.API_KEY}/SMS/${phoneNumber}/AUTOGEN3/${twoFactorConfig.TEMPLATE_NAME}`;
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      throw new Error(err);
    }
  }

  async verifyCode(phoneNumber: string, code: string) {
    const url = `${twoFactorConfig.URL}/${twoFactorConfig.API_KEY}/SMS/VERIFY3/${phoneNumber}/${code}`;
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      throw new Error(err);
    }
  }
}
