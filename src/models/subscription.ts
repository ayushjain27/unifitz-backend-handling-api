import { model, Schema } from 'mongoose';

export interface ISubscription {
  purpose: string;
  storeId: string;
  customerId: string;
  price: number;
  label: string;
}

export const subscriptionSchema: Schema = new Schema(
  {
    purpose: {
      type: String,
      required: true
    },
    storeId: {
      type: String
    },
    customerId: {
      type: String
    },
    price: {
      type: Number
    },
    label: {
      type: String
    }
  },
  { timestamps: true }
);

export const Subscription = model<ISubscription>(
  'subscription',
  subscriptionSchema
);

export default Subscription;
