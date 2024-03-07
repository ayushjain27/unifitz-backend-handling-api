import { Document, Model, model, Schema, Types } from 'mongoose';
import { IStoreCustomer, storeCustomerSchema } from './StoreCustomer';

export enum FuelPoints {
  ONE = '1 (25%)',
  TWO = '2 (55%)',
  THREE = '3 (75%)',
  FOUR = '4 (100%)'
}

export enum JobStatus {
  CREATED = 'CREATED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED'
}

export interface ILineItem {
  item: string;
  description: string;
  quantity: number;
  rate: number;
}
export interface IJobCard {
  storeId: string;
  createdBy: string;
  billingAddress: string;
  fuelPoints: FuelPoints;
  lineItems: ILineItem[];
  // refImageList: [{ key: string; docURL: string }];
  jobStatus: JobStatus;
  customerDetails?: IStoreCustomer[];
}

const jobCardSchema: Schema = new Schema(
  {
    storeId: {
      type: String,
      required: true
    },
    billingAddress: {
      type: String
    },
    fuelPoints: {
      type: String,
      enum: FuelPoints
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
    // refImageList: {
    //   type: [
    //     {
    //       key: String,
    //       docURL: String
    //     }
    //   ]
    // },
    jobStatus: {
      type: String,
      enum: JobStatus,
      default: JobStatus.CREATED,
      required: true
    },
    customerDetails: [storeCustomerSchema],
  },
  { timestamps: true }
);

const JobCard = model<IJobCard>('jobCard', jobCardSchema);

export default JobCard;
