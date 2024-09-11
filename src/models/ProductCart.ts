import { Document, model, Schema } from 'mongoose';

export enum Platform {
  PARTNER_APP_ANDROID = 'PARTNER_APP_ANDROID',
  PARTNER_APP_IOS = 'PARTNER_APP_IOS',
  ADMIN_PAGE = 'ADMIN_PAGE'
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface IProductCart {
  _id?: string;
  platform: string;
  userId: string;
  oemUserName: string;
  phoneNumber: string;
  email: string;
  productId: string;
  qty: number;
  price: number;
  retailPrice: boolean;
  bulkPrice: boolean;
  totalAmount: number;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const productCartSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      enum: Platform
    },
    userId: {
      type: String
    },
    oemUserName: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    productId: {
      type: String
    },
    qty: {
      type: Number
    },
    price: {
      type: Number
    },
    totalAmount: {
      type: Number
    },
    retailPrice: {
      type: Boolean
    },
    bulkPrice: {
      type: Boolean
    },
    status: {
      type: String,
      enum: Status
    }
  },
  { timestamps: true }
);

const ProductCartModel = model<IProductCart & Document>(
  'productcarts',
  productCartSchema
);

export default ProductCartModel;
