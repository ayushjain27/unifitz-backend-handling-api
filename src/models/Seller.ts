import mongoose, { model, Schema } from 'mongoose';

export interface ISeller {
  _id?: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  comment?: string;
}

const sellerSchema: Schema = new Schema<ISeller>(
  {
    userName: {
      type: String
    },
    email: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    comment: {
      type: String
    }
  },
  { timestamps: true }
);

const Seller = model<ISeller>('sellers', sellerSchema);

export default Seller;
