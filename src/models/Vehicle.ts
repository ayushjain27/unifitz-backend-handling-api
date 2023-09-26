import { Document, model, Schema, Types } from 'mongoose';

export interface IVehiclesInfo extends Document {
  vehicleType: string;
  vehicleId?: string;
  vehicleNumber: string;
  userId?: string;
  vehicleImageList: IVehicleImage[];
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
  url: string;
  key: string;
  title: string;
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

export const vehicleImageSchema: Schema = new Schema({
  url: {
    type: String
  },
  key: {
    type: String
  },
  title: {
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
      type: [vehicleImageSchema]
    },
    vehicleNumber: {
      type: String
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
