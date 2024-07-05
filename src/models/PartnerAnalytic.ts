import { Document, model, Schema } from 'mongoose';

export enum Platform {
  PARTNER_APP_ANDROID = 'PARTNER_APP_ANDROID',
  PARTNER_APP_IOS = 'PARTNER_APP_IOS'
}

export enum ModuleType {
  AUTH = 'AUTH',
  SCREEN_MODE = 'SCREEN_MODE',
  DISTRIBUTOR = 'DISTRIBUTOR'
}

export enum Event {
  LOGIN = 'LOGIN',
  LOGIN_OTP_VERIFY = 'LOGIN_OTP_VERIFY',
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  IMPRESSION_COUNT = 'IMPRESSION_COUNT',
  STORE_DETAIL_CLICK = 'STORE_DETAIL_CLICK',
  PRODUCT_DETAIL_CLICK = 'PRODUCT_DETAIL_CLICK',
  LOGOUT = 'LOGOUT'
}

export interface IPartnerAnalytic {
  _id?: string;
  platform: string;
  module: string;
  event: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  moduleInformation: string;
  message: string;
  startTime: string;
  endTime: string;
  totalTimeDuration?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const partnerAnalyticSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      enum: Platform
    },
    module: {
      type: String,
      enum: ModuleType
    },
    event: {
      type: String,
      enum: Event
    },

    userId: {
      type: String
    },
    fullName: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    moduleInformation: {
      type: String
    },
    startTime: {
      type: String
    },

    endTime: {
      type: String
    },

    totalTimeDuration: {
      type: Number
    },
    message: {
      type: String
    }
  },
  { timestamps: true }
);

const PartnerAnalyticModel = model<IPartnerAnalytic & Document>(
  'partners',
  partnerAnalyticSchema
);

export default PartnerAnalyticModel;
