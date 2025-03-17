
import { Document, model, Schema, Types } from 'mongoose';

export interface IParkAssistVehicle {
  vehicleType: string;
  vehicleNumber: string;
  brand: string;
  customerId?: string;
  storeId?: string;
  vehicleImageList: IParkAssistVehicleImageList;
  status: string;
}

export interface IVehicleImage {
  docURL: string;
  key: string;
}
export interface IParkAssistVehicleImageList {
  rcFrontView: IVehicleImage;
  rcBackView: IVehicleImage;
}

export enum VehicleType {
  CYCLE = 'CYCLE',
  TWO_WHEELER = 'TWO_WHEELER',
  THREE_WHEELER = 'THREE_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  COMMERCIAL_VEHICLE = 'COMMERCIAL_VEHICLE'
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export const vehicleImageSchema: Schema = new Schema<IVehicleImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});

export const parkAssistVehicleSchema: Schema = new Schema(
  {
    vehicleType: {
      type: String,
      enum: VehicleType
    },
    vehicleImageList: {
      type: {
        rcFrontView: vehicleImageSchema,
        rcBackView: vehicleImageSchema
      }
    },
    vehicleNumber: {
      type: String
    },
    brand: {
      type: String
    },
    customerId: {
      type: String
    },
    storeId: {
      type: String
    },
    status: {
      type: String,
      default: Status.INACTIVE
    }
  },
  {
    timestamps: true,
    strict: false
  }
);

const ParkAssistVehicle = model<IParkAssistVehicle>(
  'parkAssistVehicle',
  parkAssistVehicleSchema
);

export default ParkAssistVehicle;
