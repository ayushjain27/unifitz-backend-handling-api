import { Document, Model, model, Schema, Types } from 'mongoose';

export enum FuelType {
  CNG = 'cng',
  DIESEL = 'diesel',
  PETROL = 'petrol',
  EV = 'ev'
}
export enum OwnerType {
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  FOURTH_AND_ABOVE = 'fourth and above'
}
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

export interface ILineItem extends Document {
  item: Types.ObjectId;
  description: string;
  quantity: number;
  rate: number;
}
export interface IJobCard extends Document {
  storeId: string;
  createdBy: string;
  customerName: string;
  mobileNumber: string;
  billingAddress: string;
  vehicleType: string;
  brand: string;
  modelName: string;
  fuelType: FuelType;
  totalKmsRun: string;
  vehicleNumber: string;
  ownerType: OwnerType;
  mechanic: string;
  registrationYear: string;
  fuelPoints: FuelPoints;
  lineItems: [ILineItem];
  refImageList: [{ key: string; docURL: string }];
  jobStatus: JobStatus;
  comment: string;
}

const jobCardSchema: Schema = new Schema(
  {
    storeId: {
      type: String,
      required: true
    },
    customerName: {
      type: String,
      required: true
    },
    mobileNumber: {
      type: String,
      required: true
    },
    billingAddress: {
      type: String
    },
    vehicleType: {
      type: String
    },
    brand: {
      type: String
    },
    modelName: {
      type: String
    },
    fuelType: {
      type: String,
      enum: FuelType
    },
    totalKmsRun: {
      type: String
    },
    vehicleNumber: {
      type: String
    },
    ownerType: {
      type: String,
      enum: OwnerType
    },
    mechanic: {
      type: String
    },
    registrationYear: {
      type: String
    },
    fuelPoints: {
      type: String,
      enum: FuelPoints
    },
    lineItems: {
      type: [
        {
          item: Types.ObjectId,
          description: String,
          quantity: Number,
          rate: Number
        }
      ]
    },
    refImageList: {
      type: [
        {
          key: String,
          docURL: String
        }
      ]
    },
    jobStatus: {
      type: String,
      enum: JobStatus,
      default: JobStatus.CREATED,
      required: true
    },
    comment: {
      type: String
    }
  },
  { timestamps: true }
);

const JobCard: Model<IJobCard> = model('jobCard', jobCardSchema);

export default JobCard;
