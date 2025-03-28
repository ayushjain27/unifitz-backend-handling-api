import { Document, Model, model, ObjectId, Schema } from 'mongoose';

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param catalogName:string
 * @param tree:string
 * @param parent:string
 */
export interface IPayment {
  purpose: string;
  storeId: string;
  customerId: string;
  status: string;
}

export const paymentSchema: Schema = new Schema(
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
    status: {
      type: String,
      default: 'INACTIVE'
    }
  },
  { timestamps: true }
);

export const Payment = model<IPayment>(
  'payment',
    paymentSchema
);

export default Payment;
