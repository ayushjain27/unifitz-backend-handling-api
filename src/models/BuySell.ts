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
  DRAFT = 'DRAFT',
  PENDING = 'PENDING'
}

export interface ICustomerDetails {
  name: string;
  phoneNumber: number;
  address: string;
  aadharPanNumber: string;
  soldPrice: number;
  deliveryDate: Date;
  aadharPanCardImage: string;
  sellerName: string;
  sellerPhoneNumber: number;
}

export const customerDetailsSchema = new Schema({
  name: {
    type: String
  },
  phoneNumber: {
    type: Number
  },
  address: {
    type: String
  },
  aadharPanNumber: {
    type: String
  },
  soldPrice: {
    type: String
  },
  deliveryDate: {
    type: Date
  },
  aadharPanCardImage: {
    type: String
  },
  sellerName: {
    type: String
  },
  sellerPhoneNumber: {
    type: Number
  }
});

export interface IBuySell extends Document {
  _id?: Types.ObjectId | string;
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
  employeeId?: string;
  employeeName?: string;
  employeePhoneNumber?: string;
  purchasedPrice?: number;
  customerDetails?: ICustomerDetails;
  location: {
    type: string;
    coordinates: number[];
  };
  activeDate?: Date
}

export const buySellSchema: Schema = new Schema(
  {
    vehicleId: { type: String },
    vehicleInfo: { type: String, ref: 'vehicles' },
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
    oemUserName: { type: String },
    employeeId: { type: String },
    employeeName: { type: String },
    employeePhoneNumber: { type: String },
    purchasedPrice: { type: Number },
    customerDetails: {
      type: customerDetailsSchema
    },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    activeDate: {
      type: Date
    },
  },
  { timestamps: true, strict: false }
);

buySellSchema.index({ location: '2dsphere' }, { sparse: true });

const buySellVehicleInfo = model<IBuySell & Document>('buySell', buySellSchema);

export default buySellVehicleInfo;
