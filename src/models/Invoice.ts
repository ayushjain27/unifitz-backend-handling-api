import { Document, Model, model, Schema, Types } from 'mongoose';
import { IStoreCustomer, storeCustomerSchema } from './StoreCustomer';
import { IJobCard, jobCardSchema } from './JobCard';

export interface IAdditionalItems {
  _id?: string;
  title: string;
  operation: string;
  format: string;
  value: number;
}

export interface ILineItem {
  _id?: string;
  item: string;
  description: string;
  quantity: number;
  rate: number;
}

export interface IInvoice {
  storeId: string;
  invoiceNumber: string;
  vehicleNumber: string;
  name: string;
  phoneNumber: string;
  email: string;
  address: string;
  lineItems: ILineItem[];
  additionalItems: IAdditionalItems[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const invoiceSchema: Schema = new Schema(
  {
    storeId: {
      type: String,
      required: true
    },
    invoiceNumber: {
      type: String
    },
    vehicleNumber: {
      type: String
    },
    name: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    address: {
      type: String
    },
    additionalItems: {
      type: [
        {
          title: String,
          operation: String,
          format: String,
          value: Number
        }
      ]
    },
    lineItems: {
      type: [
        {
          item: String,
          description: String,
          quantity: Number,
          rate: Number
        }
      ]
    },
    totalAmount: {
      type: Number
    }
  },
  { timestamps: true }
);

const Invoice = model<IInvoice>('invoice', invoiceSchema);

export default Invoice;
