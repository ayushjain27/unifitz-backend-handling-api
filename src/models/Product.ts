import { Document, Model, model, Schema, Types } from 'mongoose';

export enum OfferType {
  PRODUCT = 'product',
  SERVICE = 'service'
}

export interface IProduct extends Document {
  storeId: string;
  createdBy: string;
  offerType: OfferType;
  itemName: string;
  unit: string;
  sellingPrice: number;
  supplierName: string;
  purchasePrice: number;
  purchaseDate: Date;
  refImage: { key: string; docURL: string };
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
    supplierName: {
      type: String
    },
    purchasePrice: {
      type: Number
    },
    purchaseDate: {
      type: Date
    },
    refImage: {
      type: {
        key: String,
        docURL: String
      }
    }
  },
  { timestamps: true }
);

const Product: Model<IProduct> = model('product', productSchema);

export default Product;
