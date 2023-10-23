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
  userId: string;
  userType: string;
  status: string;
  transactionDetails: unknown;
  contactInfo: IContactInfo;
  isOwner: boolean;
  isDealer: boolean;
  isAuthorised: boolean;
}

export const buySellSchema: Schema = new Schema(
  {
    vehicleInfo: { type: vehicleInfoSchema },
    userId: { type: Types.ObjectId, required: true },
    userType: { type: String, enum: UserType },
    status: { type: String, enum: Status },
    transactionDetails: { type: Schema.Types.Mixed },
    contactInfo: { type: storeContactSchema },
    isOwner: { type: Boolean, default: true },
    isDealer: { type: Boolean, default: true },
    isAuthorised: { type: Boolean, default: true }
  },
  { timestamps: true, strict: false }
);

const buySellVehicleInfo = model<IBuySell & Document>('buySell', buySellSchema);

export default buySellVehicleInfo;
