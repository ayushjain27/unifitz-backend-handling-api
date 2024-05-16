import { Document, model, Schema, Types } from 'mongoose';
import { IContactInfo, storeContactSchema } from './Store';
import { VehicleType, VehicleGearType, VehiclePurposeType } from './Vehicle';

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

export interface IVehicleImage {
  docURL: string;
  key: string;
}
export interface IVehicleImageList {
  frontView: IVehicleImage;
  leftView: IVehicleImage;
  seatView: IVehicleImage;
  odometer: IVehicleImage;
  rightView: IVehicleImage;
  backView: IVehicleImage;
}

export const vehicleImageSchema: Schema = new Schema<IVehicleImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export interface IVehicleInfo extends Document {
  _id?: string;
  vehicleType: string;
  vehicleNumber: string;
  userId?: string;
  vehicleImageList: IVehicleImageList;
  brand: string;
  modelName: string;
  fuel: string;
  manufactureYear: string;
  ownership: string;
  purpose: string;
  gearType: string;
  fuelType: string;
  kmsDriven: string;
  lastInsuanceDate: Date;
  lastServiceDate: Date;
  color?: string;
  bodyType?: string;
  fitnessCertificate?: boolean;
  registrationType?: string;
  expectedPrice?: number;
  noOfSeats?: number;
}

export const vehiclesInfoSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true
    },
    vehicleType: {
      type: String,
      enum: VehicleType
    },
    vehicleImageList: {
      type: {
        frontView: vehicleImageSchema,
        leftView: vehicleImageSchema,
        seatView: vehicleImageSchema,
        odometer: vehicleImageSchema,
        rightView: vehicleImageSchema,
        backView: vehicleImageSchema
      }
    },
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    brand: {
      type: String
    },
    modelName: {
      type: String
    },
    fuel: {
      type: String
    },
    manufactureYear: {
      type: String
    },
    ownership: {
      type: String
    },
    gearType: {
      type: String,
      enum: VehicleGearType
    },
    purpose: {
      type: String,
      enum: VehiclePurposeType,
      required: true
    },
    fuelType: {
      type: String
    },
    kmsDriven: {
      type: String
    },
    lastInsuanceDate: {
      type: Date
    },
    lastServiceDate: {
      type: Date
    },
    color: { type: String },
    bodyType: { type: String },
    fitnessCertificate: { type: Boolean },
    registrationType: { type: String },
    expectedPrice: { type: Number },
    noOfSeats: { type: Number }
  },
  {
    strict: false
  }
);

export interface IBuySell extends Document {
  vehicleInfo: IVehicleInfo;
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
    vehicleInfo: { type: vehiclesInfoSchema },
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
