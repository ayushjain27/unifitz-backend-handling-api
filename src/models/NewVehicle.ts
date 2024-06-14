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

// export enum ClassificationType {
//   SCOOTER = 'SCOOTER',
//   STANDERED = 'STANDERED',
//   CRUISE = 'CRUISE',
//   SPORTS = 'SPORTS',
//   TOURING = 'TOURING',
//   OFF_ROAD = 'OFF_ROAD'
// }

// export enum SpeedType {
//   HIGH_SPEED = 'HIGH_SPEED',
//   LOW_SPEED = 'LOW_SPEED'
// }

// export enum EngineType {
//   SI = 'SI',
//   FOUR_STROKE = 'FOUR_STROKE',
//   AIR_COOLED = 'AIR_COOLED',
//   SOHC = 'SOHC',
//   FUEL_INJECTION = 'FUEL_INJECTION'
// }

// export enum RidingModeType {
//   RAIN = 'RAIN',
//   SPORTS = 'SPORTS',
//   URBAN = 'URBAN'
// }

export interface IDocuments {
  profile: { key: string; docURL: string };
  vehicleImageList: {
    first: { key: string; docURL: string };
    second: { key: string; docURL: string };
    third: { key: string; docURL: string };
    fourth: { key: string; docURL: string };
    fifth: { key: string; docURL: string };
  };
}

const vehicleDocumentsSchema: Schema = new Schema<IDocuments>(
  {
    profile: {
      key: String,
      docURL: String
    },
    vehicleImageList: {
      type: {
        first: { key: String, docURL: String },
        second: { key: String, docURL: String },
        third: { key: String, docURL: String },
        fourth: { key: String, docURL: String },
        fifth: { key: String, docURL: String }
      }
    }
  },
  {
    _id: false,
    strict: false
  }
);

export interface INewVehicle {
  _id?: Types.ObjectId;
  oemUserName?: string;
  documents: IDocuments;
  vehicle: string;
  fuelType: string;
  sku: string;
  classification: string;
  cng: string;
  highLowSpeed: string;
  brand: string;
  model: string;
  variant: string;
  color: string;
  colorName: string;
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
}

const newVehicleSchema: Schema = new Schema<INewVehicle>(
  {
    oemUserName: {
      type: String
    },
    documents: {
      type: vehicleDocumentsSchema
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
    color: {
      type: String
    },
    colorName: {
      type: String
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
    }
  },
  { timestamps: true, strict: false }
);

const NewVehicle = model<INewVehicle>('newvehicles', newVehicleSchema);

export default NewVehicle;
