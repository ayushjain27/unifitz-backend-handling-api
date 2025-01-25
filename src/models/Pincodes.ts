import { model, Schema } from 'mongoose';

export interface IPincodes {
  _id?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

const pincodesSchema: Schema = new Schema(
  {
    state: {
      type: String
    },
    city: {
      type: String
    },
    pincode: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

const Pincodes = model<IPincodes>('pincode', pincodesSchema);

export default Pincodes;
