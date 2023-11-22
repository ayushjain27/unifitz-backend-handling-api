import { Document, model, Schema, Types } from 'mongoose';

export interface IVehiclesInfo extends Document {
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

export enum VehiclePurposeType {
  BUY_SELL = 'BUY_SELL',
  OWNED = 'OWNED'
}

export enum VehicleGearType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC'
}

export enum VehicleType {
  CYCLE = 'CYCLE',
  TWO_WHEELER = 'TWO_WHEELER',
  THREE_WHEELER = 'THREE_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  COMMERCIAL_VEHICLE = 'COMMERCIAL_VEHICLE'
}

export enum FuelType {
  DISEL = 'DISEL',
  PETROL = 'PETROL',
  EV = 'EV',
  CNG = 'CNG',
  LPG = 'LPG'
}

export const vehicleImageSchema: Schema = new Schema<IVehicleImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export const vehicleInfoSchema: Schema = new Schema(
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

const VechicleInfo = model<IVehiclesInfo & Document>(
  'vehicles',
  vehicleInfoSchema
);

export default VechicleInfo;
