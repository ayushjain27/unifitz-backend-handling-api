import { Document, model, Schema, Types } from 'mongoose';

export interface IParkAssistVehicle {
  vehicleType: string;
  vehicleNumber: string;
  brand: string;
  customerId?: string;
  partnerId?: string;
  vehicleImageList: IVehicleImageList;
}

export interface IVehicleImage {
  docURL: string;
  key: string;
}
export interface IVehicleImageList {
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
    partnerId: {
      type: String
    },
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
