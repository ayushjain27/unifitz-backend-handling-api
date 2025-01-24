import { Document, model, Schema } from 'mongoose';

export enum Platform {
  CUSTOMER_APP_ANDROID = 'CUSTOMER_APP_ANDROID',
  CUSTOMER_APP_IOS = 'CUSTOMER_APP_IOS',
  PARTNER_APP_ANDROID = 'PARTNER_APP_ANDROID',
  PARTNER_APP_IOS = 'PARTNER_APP_IOS'
}

export enum Event {
  IMPRESSION_COUNT = 'IMPRESSION_COUNT',
  VEHICLE_DETAIL_CLICK = 'VEHICLE_DETAIL_CLICK',
  ENQUIRY_CLICK = 'ENQUIRY_CLICK'
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

export interface INewVehicleAnalytic {
  _id?: string;
  platform: string;
  event: string;
  userInformation: IUserInfo;
  moduleInformation?: string;
  enquiryStoreId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  oemUserName?: string;
}

const newVehicleAnalyticSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      enum: Platform
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
    enquiryStoreId: {
      type: String
    },
    oemUserName: {
      type: String
    }
  },
  { timestamps: true }
);

// newVehicleAnalyticSchema.index({ 'userInformation.geoLocation': '2dsphere' });

const NewVehicleAnalyticModel = model<INewVehicleAnalytic & Document>(
  'newvehicleanalytics',
  newVehicleAnalyticSchema
);

export default NewVehicleAnalyticModel;
