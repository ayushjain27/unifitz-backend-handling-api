import { Document, model, Schema } from 'mongoose';
import { IUserInfo, userInfoSchema, Platform } from './CustomerEventAnalytic';

export enum ModuleType {
  EVENT = 'EVENT',
  OFFERS = 'OFFERS',
  BUSINESS_OPPORTUNITIES = 'BUSINESS_OPPORTUNITIES',
  SCHOOL_OF_AUTO = 'SCHOOL_OF_AUTO',
  BANNER = 'BANNER'
}

export enum Event {
  EVENT_INTEREST = 'EVENT_INTEREST',
  EVENT_CLICK = 'EVENT_CLICK',
  OFFER_ENQUIRY = 'OFFER_ENQUIRY',
  OFFER_CLICK = 'OFFER_CLICK',
  BUSINESS_ENQUIRY = 'BUSINESS_ENQUIRY',
  IMPRESSION_COUNT = 'IMPRESSION_COUNT',
  MAP_VIEW = 'MAP_VIEW'
}

export interface IPlusFeaturesAnalytic {
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
}

const plusFeatureAnalyticSchema: Schema = new Schema(
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
    }
  },
  { timestamps: true }
);

plusFeatureAnalyticSchema.index({ 'userInformation.geoLocation': '2dsphere' });

const PlusFeatureAnalyticModel = model<IPlusFeaturesAnalytic & Document>(
  'plusfeatures',
  plusFeatureAnalyticSchema
);

export default PlusFeatureAnalyticModel;
