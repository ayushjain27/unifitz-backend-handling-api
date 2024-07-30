import { Document, model, Schema } from 'mongoose';

export enum Platform {
  CUSTOMER_APP_ANDROID = 'CUSTOMER_APP_ANDROID',
  CUSTOMER_APP_IOS = 'CUSTOMER_APP_IOS',
  PARTNER_APP_ANDROID = 'PARTNER_APP_ANDROID',
  PARTNER_APP_IOS = 'PARTNER_APP_IOS'
}

export enum ModuleType {
  STORE = 'STORE',
  VEHICLE = 'VEHICLE'
}

export enum Event {
  IMPRESSION_COUNT = 'IMPRESSION_COUNT',
  VEHICLE_DETAIL_CLICK = 'VEHICLE_DETAIL_CLICK',
  EXECUTIVE_PHONE_NUMBER_CLICK = 'EXECUTIVE_PHONE_NUMBER_CLICK',
  STORE_PHONE_NUMBER_CLICK = 'STORE_PHONE_NUMBER_CLICK',
  LOCATION_CLICK = 'LOCATION_CLICK'
}

export interface IUserInfo extends Document {
  userId: string;
  phoneNumber: string;
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
    phoneNumber: {
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

export interface IVehicleAnalytic {
  _id?: string;
  platform: string;
  module: string;
  event: string;
  userInformation: IUserInfo;
  moduleInformation: string;
  vehicleStoreId?: string;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
  oemUserName?: string;
}

const vehicleAnalyticSchema: Schema = new Schema(
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
    vehicleStoreId: {
      type: String
    },
    oemUserName: {
      type: String
    },
    message: {
      type: String
    }
  },
  { timestamps: true }
);

vehicleAnalyticSchema.index({ 'userInformation.geoLocation': '2dsphere' });

const VehicleAnalyticModel = model<IVehicleAnalytic & Document>(
  'vehicleanalytics',
  vehicleAnalyticSchema
);

export default VehicleAnalyticModel;
