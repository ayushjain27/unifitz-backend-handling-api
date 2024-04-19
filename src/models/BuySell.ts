import { Document, model, Schema, Types } from 'mongoose';
import { IVehiclesInfo, vehicleInfoSchema } from './Vehicle';
import { IContactInfo, storeContactSchema } from './Store';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  DEALER = 'DEALER'
}

export enum Status {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  UNSOLD = 'UNSOLD',
  EXPIRED = 'EXPIRED',
  PROCESSING = 'PROCESSING'
}

export interface IBuySell extends Document {
  vehicleInfo: IVehiclesInfo;
  storeId: string;
  userId: string;
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
}

export const buySellSchema: Schema = new Schema(
  {
    vehicleInfo: { type: vehicleInfoSchema },
    userId: { type: Types.ObjectId, required: true },
    storeId: { type: String },
    userType: { type: String, enum: UserType },
    status: { type: String, enum: Status },
    transactionDetails: { type: Schema.Types.Mixed },
    contactInfo: { type: storeContactSchema },
    isOwner: { type: Boolean, required: true },
    isDealer: { type: Boolean, required: true },
    isAuthorised: { type: Boolean, required: true },
    hpLoan: { type: Boolean, required: true },
    insuranceExperience: { type: String, required: true },
    description: { type: String }
  },
  { timestamps: true, strict: false }
);

const buySellVehicleInfo = model<IBuySell & Document>('buySell', buySellSchema);

export default buySellVehicleInfo;
