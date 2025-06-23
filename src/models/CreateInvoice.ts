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
export interface ICreateInvoice {
  storeId: string;
  invoiceNumber: string;
  jobCardId: string;
  additionalItems: IAdditionalItems[];
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const createInvoiceSchema: Schema = new Schema(
  {
    storeId: {
      type: String,
      required: true
    },
    jobCardId: {
      type: String,
      required: true
    },
    invoiceNumber: {
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
    totalAmount: {
      type: Number
    }
  },
  { timestamps: true }
);

const CreateInvoice = model<ICreateInvoice>(
  'createInvoice',
  createInvoiceSchema
);

export default CreateInvoice;
