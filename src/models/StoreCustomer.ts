import { Document, model, Schema, Types } from 'mongoose';

/**
 * Interface to model the Customer Schema for TypeScript.
 */

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

export interface IStoreCustomerVehicleInfo {
  _id?: string;
  vehicleType: string;
  brand: string;
  modelName: string;
  fuelType: string;
  totalKmsRun: string;
  vehicleNumber: string;
  ownerType: string;
  employeeName: string;
  registrationYear: Date;
  insurance: string;
  registeredVehicle: string;
  insuranceExpiryDate: Date;
  vehicleImageList: IVehicleImageList;
}

export const storeCustomerVehicleInfoSchema: Schema = new Schema(
  {
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
    },
    brand: {
      type: String
    },
    modelName: {
      type: String
    },
    fuelType: {
      type: String
    },
    ownerType: {
      type: String
    },
    totalKmsRun: {
      type: String
    },
    employeeName: {
      type: String
    },
    registrationYear: {
      type: Date
    },
    insurance: {
      type: String
    },
    registeredVehicle: {
      type: String
    },
    insuranceExpiryDate: {
      type: Date
    }
  },
  {
    strict: false
  }
);

export interface IStoreCustomer {
  _id?: string;
  name: string;
  phoneNumber: string;
  email?: string;
  storeId: string;
  billingAddress: string;
  storeCustomerVehicleInfo?: IStoreCustomerVehicleInfo[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const storeCustomerSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    email: {
      type: String
    },
    billingAddress: {
      type: String
    },
    storeId: {
      type: String,
      required: true
    },
    storeCustomerVehicleInfo: {
      type: [storeCustomerVehicleInfoSchema]
    }
  },
  { timestamps: true }
);

const StoreCustomer = model<IStoreCustomer>(
  'storeCustomers',
  storeCustomerSchema
);

export default StoreCustomer;
