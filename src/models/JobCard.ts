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
}

const jobCardSchema: Schema = new Schema({
    
}, { timestamps: true });

const JobCard: Model<IJobCard> = model('jobCard', jobCardSchema);

export default JobCard;
