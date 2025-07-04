import { Document, model, Schema, Types } from 'mongoose';

export interface IInterestedEventAndOffer {
  storeId?: string;
  customerId?: string;
  eventOffersId: string;
  isInterested: boolean;
  name?: string;
  phoneNumber?: string;
  eventName?: string;
  offerName?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
  eventofferType: string;
}

export const interestedEventAndOfferSchema: Schema = new Schema(
  {
    storeId: {
      type: String
    },
    customerId: {
      type: String
    },
    eventOffersId: {
      type: String
    },
    isInterested: {
      type: Boolean,
      default: false
    },
    name: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    eventName: {
      type: String
    },
    offerName: {
      type: String
    },
    email: {
      type: String
    },
    eventofferType: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const InterestedEventAndOffer = model<IInterestedEventAndOffer>(
  'interestedEventsAndOffers',
  interestedEventAndOfferSchema
);

export default InterestedEventAndOffer;
