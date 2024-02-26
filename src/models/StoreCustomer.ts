import { Document, model, Schema, Types } from 'mongoose';

/**
 * Interface to model the Customer Schema for TypeScript.
 */
export interface IStoreCustomer {
  _id?: string;
  name: string;
  phoneNumber: string;
  email: string;
  storeId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const storeCustomerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    storeId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const StoreCustomer = model<IStoreCustomer>('storeCustomers', storeCustomerSchema);

export default StoreCustomer;
