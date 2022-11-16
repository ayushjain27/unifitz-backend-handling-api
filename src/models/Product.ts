import { Document, Model, model, Schema, Types } from 'mongoose';

export enum OfferType {
  PRODUCT = 'product',
  SERVICE = 'service'
}

export interface IImage {
  key: string;
  docURL: string;
}

export const IImageSchema: Schema = new Schema<IImage>({
  key: {
    type: String
  },
  docURL: {
    type: String
  }
});

export interface IProduct {
  storeId: string;
  offerType: OfferType;
  itemName: string;
  unit: string;
  sellingPrice: number;
  salesAccount: string;
  salesDescription: string;
  purchasePrice: number;
  purchaseAccount: string;
  purchaseDescription: string;
  productImageList: IImage[];
}

const productSchema: Schema = new Schema(
  {
    storeId: {
      type: String,
      required: true
    },
    offerType: {
      type: String,
      enum: OfferType,
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    unit: {
      type: String
    },
    sellingPrice: {
      type: Number
    },
    salesAccount: {
      type: String
    },
    salesDescription: {
      type: String
    },
    purchasePrice: {
      type: Number
    },
    purchaseAccount: {
      type: String
    },
    purchaseDescription: {
      type: String
    },
    productImageList: {
      type: [IImageSchema]
    }
  },
  { timestamps: true }
);

const Product = model<IProduct & Document>('product', productSchema);

export default Product;
