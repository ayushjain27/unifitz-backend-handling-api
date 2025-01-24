import { model, Schema } from 'mongoose';

export interface ISparePostRequirement {
  storeId: string;
  vehicleType: string;
  sparePartImage: string;
  description: string;
  audioDescription: string;
  customerId: string;
}

const sparePostRequirement: Schema = new Schema<ISparePostRequirement>(
  {
    storeId: {
      type: String
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
    audioDescription: {
      type: String
    },
    sparePartImage: {
      type: String
    }
  },
  { timestamps: true }
);

export const StaticIds = model<ISparePostRequirement>(
  'sparePostRequirement',
  sparePostRequirement
);
