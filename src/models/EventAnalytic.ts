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
  AUTH = 'AUTH'
}

export enum Event {
  SEARCH = 'SEARCH',
  STORE_DETAIL_CLICK = 'STORE_DETAIL_CLICK',
  STORE_ADD = 'STORE_ADD',
  STORE_EDIT = 'STORE_EDIT',
  LOGIN_PHONE = 'LOGIN_PHONE',
  LOGIN_WEB = 'LOGIN_WEB',
  LOGIN_OTP_VERIFY = 'LOGIN_OTP_VERIFY'
}

export interface IUserInfo extends Document {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  state: string; //<String>
  pincode: string; //<string>
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
    },
    pincode: {
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
  message: string;
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
    message: {
      type: String
    }
  },
  { timestamps: true }
);

eventAnalyticSchema.index({ 'userInformation.geoLocation': '2dsphere' });

const EventAnalyticModel = model<IEventAnalytic & Document>(
  'eventLog',
  eventAnalyticSchema
);

export default EventAnalyticModel;
