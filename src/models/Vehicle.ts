import { Document, model, Schema, Types } from 'mongoose';

export interface IVehiclesInfo extends Document {
  userId: string;
  vehicleType: string;
  vehicleImage: IVehicleImage;
  vehicleNumber: string;
  category: string;
  brand: string;
  modelName: string;
  fuel: string;
  manufactureYear: string;
  ownership: string;
  gearType: string;
  purpose: string;
  fuelType: string;
  kmsDriven: string;
}

export interface IVehicleImage extends Document {
  url: string;
  key: string;
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

export enum FuelType {
  DISEL = 'DISEL',
  PETROL = 'PETROL',
  EV = 'EV',
  CNG = 'CNG',
  LPG = 'LPG'
}

const vehicleImageSchema: Schema = new Schema({
  url: {
    type: String
  },
  title: {
    type: String
  }
});

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
    gearType: {
      type: String
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
