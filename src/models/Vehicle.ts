import { Document, model, Schema, Types } from 'mongoose';

export interface IVehiclesInfo extends Document {
  userId: string;
  vehicleType: string;
  vehicleImage: string;
  vehicleNumber: string;
  category: string;
  brand: string;
  modelName: string;
  fuel: string;
  manufactureYear: string;
  ownership: string;
  purpose: string;
}

export interface VehicleImage extends Document {
  url: string;
  title: string;
}

export enum VehiclePurposeType {
  BUY_SELL = 'BUY_SELL',
  OWNED = 'OWNED'
}

export enum VehicleType {
  CYCLE = 'CYCLE',
  TWO_WHEELER = 'TWO_WHEELER',
  THREE_WHEELER = 'THREE_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  COMMERCIAL_VEHICLE = 'COMMERCIAL_VEHICLE'
}

const vehicleImageSchema: Schema = new Schema(
  {
    url: {
      type: String
    },
    title: {
      type: String
    }
  },
  { _id: false }
);

const vehicleInfoSchema: Schema = new Schema(
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
    category: {
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
    purpose: {
      type: String,
      enum: VehiclePurposeType,
      required: true
    }
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
