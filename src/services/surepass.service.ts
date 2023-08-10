import { injectable } from 'inversify';
import axios from 'axios';
import { twoFactorConfig } from '../config/constants';

@injectable()
export class SurepassService {
  async getGstDetails(gstin: string) {}

  async getUdhyamDetails(udhyamNo: string) {}

  async sendOtpForAadharVerify(aadharNo: string) {}

  async verifyOtpForAadharVerify(clientId: string, otp: string) {}
}
