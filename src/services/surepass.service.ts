import { injectable } from 'inversify';
import axios from 'axios';
import _ from 'lodash';
import { surepassConfig } from '../config/constants';

// const axiosConfig: any = {
//   method: 'post',
//   maxBodyLength: Infinity,
//   url: surepassConfig.URL,
//   headers: {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${surepassConfig.API_KEY}`
//   },
//   data: {}
// };
const axiosInstance = axios.create({
  baseURL: surepassConfig.URL,
  timeout: 60000,
  maxBodyLength: Infinity,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${surepassConfig.API_KEY}`
  }
});

const urls = {
  GSTIN: '/corporate/gstin',
  UDHYAM: '/corporate/udyog-aadhaar',
  GENERATE_AADHAR_OTP: '/aadhaar-v2/generate-otp',
  VERIFY_AADHAR_OTP: '/aadhaar-v2/submit-otp'
};
@injectable()
export class SurepassService {
  async getGstDetails(gstin: string) {
    if (gstin) {
      const response = await axiosInstance.post(urls.GSTIN, {
        id_number: gstin,
        filing_status_get: false
      });
      if (!_.isEmpty(response.data.data)) {
        return response.data.data;
      }
    }
    return null;
  }

  async getUdhyamDetails(udhyamNo: string) {
    if (udhyamNo) {
      const response = await axiosInstance.post(urls.UDHYAM, {
        id_number: udhyamNo
      });
      if (!_.isEmpty(response.data.data)) {
        return response.data.data;
      }
    }
    return null;
  }

  async sendOtpForAadharVerify(aadharNo: string) {
    if (aadharNo) {
      const response = await axiosInstance.post(urls.GENERATE_AADHAR_OTP, {
        id_number: aadharNo
      });
      if (!_.isEmpty(response.data.data)) {
        return response.data.data;
      }
    }
    return null;
  }

  async verifyOtpForAadharVerify(clientId: string, otp: string) {
    if (clientId && otp) {
      const response = await axiosInstance.post(urls.VERIFY_AADHAR_OTP, {
        client_id: clientId,
        otp
      });
      if (!_.isEmpty(response.data.data)) {
        return response.data.data;
      }
    }
    return null;
  }
}
