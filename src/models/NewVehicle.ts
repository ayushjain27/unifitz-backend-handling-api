import { model, ObjectId, Schema, Types } from 'mongoose';

export enum VehicleType {
  CYCLE = 'CYCLE',
  TWO_WHEELER = 'TWO_WHEELER',
  THREE_WHEELER = 'THREE_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  COMMERCIAL_VEHICLE = 'COMMERCIAL_VEHICLE'
}

export enum FuelType {
  PETROL = 'PETROL',
  ELECTRIC = 'ELECTRIC',
  KICK_SCOOTER = 'KICK_SCOOTER',
  CNG = 'CNG'
}
export enum VehicleProfileStatus {
  DRAFT = 'DRAFT',
  ONBOARDED = 'ONBOARDED',
  REJECTED = 'REJECTED'
}

export interface IColorCode {
  color?: string;
  colorName?: string;
  skuNumber?: string;
  image: { key: string; docURL: string };
}

export const colorCodeSchema: Schema = new Schema(
  {
    color: {
      type: String
    },
    colorName: {
      type: String
    },
    skuNumber: {
      type: String
    },
    vehicleImageList: {
      type: { key: String, docURL: String }
    }
  },
  {
    _id: false,
    strict: false
  }
);

export interface IVideoUrl {
  key: string;
  docURL: string;
}

export const videoSchema: Schema = new Schema(
  {
    key: {
      type: String
    },
    docURL: { type: String }
  },
  {
    _id: false,
    strict: false
  }
);

export interface INewVehicle {
  _id?: Types.ObjectId;
  oemUserName?: string;
  vehicleNameSuggest: string;
  videoUrl: IVideoUrl;
  vehicle: string;
  fuelType: string;
  sku: string;
  classification: string;
  cng: string;
  highLowSpeed: string;
  brand: string;
  model: string;
  variant: string;
  colorCode: IColorCode[];
  price: string;
  motors: string;
  battery: string;
  speed: string;
  externalUrl: string;
  display: string;
  charger: string;
  chargingTime: string;
  drivingRange: string;
  frontBrake: string;
  rearBrake: string;
  driveMode: string;
  wheelSize: string;
  tyreType: string;
  wheelbase: string;
  weight: string;
  maxLoad: string;
  groundClearance: string;
  bootSpace: string;
  warranty: string;
  additionalFeature: string;
  engineType: string;
  displacement: string;
  maxTorque: string;
  coolingSystem: string;
  valveCylinder: string;
  starting: string;
  gearBox: string;
  emissionType: string;
  ridingModes: string;
  displayType: string;
  seats: string;
  partnerEmail: string;
  status: string;
  rejectionReason: string;
}

const newVehicleSchema: Schema = new Schema<INewVehicle>(
  {
    oemUserName: {
      type: String
    },
    vehicleNameSuggest: {
      type: String
    },
    videoUrl: {
      type: videoSchema
    },
    vehicle: {
      type: String,
      enum: VehicleType
    },
    fuelType: {
      type: String,
      enum: FuelType
    },
    sku: {
      type: String
    },
    classification: {
      type: String
      //   enum: ClassificationType
    },
    cng: {
      type: String
    },
    highLowSpeed: {
      type: String
      //   enum: SpeedType,
    },
    brand: {
      type: String
    },
    model: {
      type: String
    },
    variant: {
      type: String
    },
    seats: {
      type: String
    },
    // color: {
    //   type: String
    // },
    // colorName: {
    //   type: String
    // },
    colorCode: {
      type: [colorCodeSchema]
    },
    price: {
      type: String
    },
    motors: {
      type: String
    },
    battery: {
      type: String
    },
    speed: {
      type: String
    },
    externalUrl: {
      type: String
    },
    display: {
      type: String
    },
    charger: {
      type: String
    },
    chargingTime: {
      type: String
    },
    drivingRange: {
      type: String
    },
    frontBrake: {
      type: String
    },
    rearBrake: {
      type: String
    },
    driveMode: {
      type: String
    },
    wheelSize: {
      type: String
    },
    tyreType: {
      type: String
    },
    wheelbase: {
      type: String
    },
    weight: {
      type: String
    },
    maxLoad: {
      type: String
    },
    groundClearance: {
      type: String
    },
    bootSpace: {
      type: String
    },
    warranty: {
      type: String
    },
    additionalFeature: {
      type: String
    },
    engineType: {
      type: String
      //   enum: EngineType,
    },
    displacement: {
      type: String
    },
    maxTorque: {
      type: String
    },
    coolingSystem: {
      type: String
    },
    valveCylinder: {
      type: String
    },
    starting: {
      type: String
    },
    gearBox: {
      type: String
    },
    emissionType: {
      type: String
    },
    ridingModes: {
      type: String
      //   enum: RidingModeType,
    },
    displayType: {
      type: String
    },
    partnerEmail: {
      type: String
    },
    status: {
      type: String,
      required: true,
      enum: VehicleProfileStatus,
      default: VehicleProfileStatus.DRAFT
    },
    rejectionReason: {
      type: String,
      default: ''
    }
  },
  { timestamps: true, strict: false }
);

const NewVehicle = model<INewVehicle>('newvehicles', newVehicleSchema);

export default NewVehicle;
