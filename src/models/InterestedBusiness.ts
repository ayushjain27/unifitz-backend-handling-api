import { Document, model, Schema, Types } from 'mongoose';

export interface IInterestedBusiness {
  storeId?: string;
  customerId?: string;
  businessId: string;
  isInterested: boolean;
  userName?: string;
  phoneNumber?: string;
  organizerName?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const interestedBusinessSchema: Schema = new Schema(
  {
    storeId: {
      type: String
    },
    customerId: {
      type: String
    },
    businessId: {
      type: String
    },
    isInterested: {
      type: Boolean,
      default: false
    },
    userName: {
        type: String
    },
    phoneNumber: {
      type: String
    },
    organizerName: {
      type: String
    },
    email: {
      type: String
    }
  },
  { timestamps: true }
);

const InterestedBusiness = model<IInterestedBusiness>(
  'interestedBusiness',
  interestedBusinessSchema
);

export default InterestedBusiness;