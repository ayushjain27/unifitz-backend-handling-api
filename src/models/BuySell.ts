import mongoose, { Document, model, Schema, Types } from 'mongoose';
import { IContactInfo, storeContactSchema } from './Store';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'PARTNER'
}

export enum Status {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  EXPIRED = 'EXPIRED',
  PROCESSING = 'PROCESSING',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT'
}

export interface IBuySell extends Document {
  vehicleId: string;
  storeId: string;
  userId?: string;
  userType: string;
  status: string;
  transactionDetails: unknown;
  contactInfo: IContactInfo;
  isOwner: boolean;
  isDealer: boolean;
  isAuthorised: boolean;
  hpLoan: boolean;
  insuranceExperience: string;
  description: string;
  oemUserName: string;
  vehicleCategory: string;
}

export const buySellSchema: Schema = new Schema(
  {
    vehicleId: {type: String},
    vehicleInfo: {type: String,
      ref: "vehicles"},
    userId: { type: Types.ObjectId },
    storeId: { type: String },
    userType: { type: String, enum: UserType },
    status: { type: String, enum: Status, default: Status.DRAFT },
    transactionDetails: { type: Schema.Types.Mixed },
    contactInfo: { type: storeContactSchema },
    isOwner: { type: Boolean, required: true },
    isDealer: { type: Boolean, required: true },
    isAuthorised: { type: Boolean, required: true },
    hpLoan: { type: Boolean, required: true },
    insuranceExperience: { type: String, required: true },
    description: { type: String },
    vehicleCategory: { type: String },
    oemUserName: { type: String }
  },
  { timestamps: true, strict: false }
);

const buySellVehicleInfo = model<IBuySell & Document>('buySell', buySellSchema);


export default buySellVehicleInfo;
