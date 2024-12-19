import { Document, model, Schema } from 'mongoose';

export enum Platform {
  CUSTOMER_APP_ANDROID = 'CUSTOMER_APP_ANDROID',
  CUSTOMER_APP_IOS = 'CUSTOMER_APP_IOS',
  PARTNER_APP_ANDROID = 'PARTNER_APP_ANDROID',
  PARTNER_APP_IOS = 'PARTNER_APP_IOS'
}

export enum Event {
  IMPRESSION_COUNT = 'IMPRESSION_COUNT',
  DETAIL_CLICK_EVENT = 'DETAIL_CLICK_EVENT',
  ENQUIRY_SUBMISSION = 'ENQUIRY_SUBMISSION'
}

export interface IUserInfo extends Document {
  userId: string;
  phoneNumber: string;
  city: string;
  state: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
}

export const userInfoSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    geoLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    state: { type: String, required: true },
    city: { type: String, required: true }
  },
  {
    _id: false
  }
);

userInfoSchema.index({ geoLocation: '2dsphere' });

export interface IMarketingAnalytic extends Document {
  platform: Platform;
  event: Event;
  userInformation: IUserInfo;
  marketingId?: string;
  digitalContact?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const marketingAnalyticSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      enum: Platform,
      required: true
    },
    event: {
      type: String,
      enum: Event,
      required: true
    },
    userInformation: {
      type: userInfoSchema,
      required: true
    },
    marketingId: {
      type: String
    },
    digitalContact: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

marketingAnalyticSchema.index({ 'userInformation.geoLocation': '2dsphere' });

const MarketingAnalyticModel = model<IMarketingAnalytic & Document>(
  'marketinganalytics',
  marketingAnalyticSchema
);

export default MarketingAnalyticModel;
