import { Document, model, Schema, Types } from 'mongoose';

export interface IVehiclesInfo extends Document {
  customerId: string;
  vehicleImage: string;
  vehicleNumber: string;
  category: string;
  brand: string;
  modelName: string;
  fuel: string;
  manufactureYear: string;
  ownership: string;
}

export interfac IVe

const vehicleInfoSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true
    },
    vehicleImageList: {
      type: String
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
    }
  },
  {
    _id: false
  }
);

const VechicleInfo = model<IVehiclesInfo & Document>(
  'vehicles',
  vehicleInfoSchema
);

export default VechicleInfo;
