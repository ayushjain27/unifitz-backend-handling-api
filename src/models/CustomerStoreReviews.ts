import { model, Schema, Types } from 'mongoose';

export interface ICustomerStoreReview {
  _id?: Types.ObjectId;
  storeId: string;
  customerId: string;
  count: number;
  lastCountReset: Date;
}

const customerStoreReviewSchema: Schema = new Schema(
  {
    storeId: {
      type: String
    },
    customerId: {
      type: String,
      required: true
    },
    count: {
      type: Number
    },
    lastCountReset: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const CustomerStoreReview = model<ICustomerStoreReview>('customerStoreReview', customerStoreReviewSchema);

export default CustomerStoreReview;
