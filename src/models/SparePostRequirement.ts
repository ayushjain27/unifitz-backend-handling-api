import { model, Schema, Types } from 'mongoose';

export interface ISparePostRequirement {
  _id?: Types.ObjectId;
  storeId: string;
  vehicleType: string;
  sparePartImage: { key: string; docURL: string };
  description: string;
  customerId: string;
  audioUrl: { key: string; docURL: string };
  platform: string;
  geoLocation: {
    // kind: string;
    type: string;
    coordinates: number[];
  };
  state: string;
  city: string;
  brand: string;
}

const sparePostRequirement: Schema = new Schema<ISparePostRequirement>(
  {
    storeId: {
      type: String,
    },
    customerId: {
      type: String
    },
    vehicleType: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    sparePartImage: { type: { key: String, docURL: String } },
    audioUrl: { type: { key: String, docURL: String } },
    platform: {
      type: String
    },
     geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    brand: {
      type: String
    }
  },
  { timestamps: true }
);

export const SparePost = model<ISparePostRequirement>(
  'sparePostRequirement',
  sparePostRequirement
);
