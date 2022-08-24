import { Document, model, Schema, Types } from 'mongoose';

export interface IVehiclesInfo extends Document {
  customerId: string;
  vehicleImage: string;
  vehicleNumber: string;
  category: string;
  brand: string;
  modelName: string;
  fuel: string;
  year: string;
  ownership: string;
}

const vehicleInfoSchema: Schema = new Schema(
  {
    customerId: {
      type: Types.ObjectId,
      required: true
    },
    vehicleImage: {
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
    year: {
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
