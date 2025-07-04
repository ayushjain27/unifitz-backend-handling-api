import { Document, model, Schema } from 'mongoose';

export enum Platform {
  CUSTOMER_APP_ANDROID = 'CUSTOMER_APP_ANDROID',
  CUSTOMER_APP_IOS = 'CUSTOMER_APP_IOS',
  CUSTOMER_WEB = 'CUSTOMER_WEB',
  STORE_APP_ANDROID = 'STORE_APP_ANDROID',
  STORE_APP_IOS = 'STORE_APP_IOS'
}

export enum ModuleType {
  STORE = 'STORE',
  PRODUCT = 'PRODUCT',
  VEHICLE = 'VEHICLE',
  SEARCH_PRODUCT = 'SEARCH_PRODUCT',
  AUTH = 'AUTH',
  LOCATION = 'LOCATION',
  JOB_CARD = 'JOB_CARD',
  INVOICE = 'INVOICE',
  CATEGORIES = 'CATEGORIES'
}

export enum Event {
  SEARCH = 'SEARCH',
  STORE_DETAIL_CLICK = 'STORE_DETAIL_CLICK',
  PRODUCT_DETAIL_CLICK = 'PRODUCT_DETAIL_CLICK',
  INVOICE_DETAIL_CLICK = 'INVOICE_DETAIL_CLICK',
  VEHICLE_ADD = 'VEHICLE_ADD',
  VEHICLE_EDIT = 'VEHICLE_EDIT',
  LOGIN_PHONE = 'LOGIN_PHONE',
  LOGIN_WEB = 'LOGIN_WEB',
  LOGIN_OTP_VERIFY = 'LOGIN_OTP_VERIFY',
  MAP_VIEW = 'MAP_VIEW',
  PHONE_NUMBER_CLICK = 'PHONE_NUMBER_CLICK',
  REPORT_US = 'REPORT_US',
  SHARE_STORE_DETAIL = 'SHARE_STORE_DETAIL',
  IMPRESSION_COUNT = 'IMPRESSION_COUNT',
  LOCATION_CHANGE = 'LOCATION_CHANGE',
  CATEGORY_CLICK = 'CATEGORY_CLICK',
  SUB_CATEGORY_CLICK = 'SUB_CATEGORY_CLICK',
  BRAND_CLICK = 'BRAND_CLICK',
  LOGOUT = 'LOGOUT'
}

export interface IUserInfo extends Document {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string; //<String>
  geoLocation: {
    type: string;
    coordinates: number[];
  };
}

export const userInfoSchema: Schema = new Schema(
  {
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
    address: {
      type: String
    },
    geoLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    state: {
      type: String
    },
    city: {
      type: String
    }
  },
  {
    _id: false
  }
);

userInfoSchema.index({ geoLocation: '2dsphere' });

export interface IEventAnalytic {
  _id?: string;
  platform: string;
  module: string;
  event: string;
  userInformation: IUserInfo;
  moduleInformation: string;
  oemUserName: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
  category?: string;
}

const eventAnalyticSchema: Schema = new Schema(
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
    userInformation: {
      type: userInfoSchema
    },
    moduleInformation: {
      type: String
    },
    oemUserName: {
      type: String
    },
    message: {
      type: String
    },
    category: {
      type: String
    }
  },
  { timestamps: true }
);

// eventAnalyticSchema.index({ 'userInformation.geoLocation': '2dsphere' });

const EventAnalyticModel = model<IEventAnalytic & Document>(
  'eventLog',
  eventAnalyticSchema
);

export default EventAnalyticModel;
