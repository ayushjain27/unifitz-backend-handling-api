import { model, Schema, Types } from 'mongoose';
import { ICatalogMap, storeCatalogMapSchema } from './Store';

export enum OfferType {
  PRODUCT = 'product',
  SERVICE = 'service'
}

export interface IImage {
  key: string;
  docURL: string;
}

export interface IProductImageList {
  profile: IImage;
  first: IImage;
  second: IImage;
  third: IImage;
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
  brand: ICatalogMap[]; //<Object> {_id:, name:} {required}, _id - unique - (MD)
  category: ICatalogMap[]; //<Object> {_id:, name:} {required}, - (MD)
  subCategory: ICatalogMap[]; //<Array> {_id:, name:}{required}  - (MD),
  unit: string;
  sellingPrice: number;
  discountPrice: number;
  salesAccount: string;
  salesDescription: string;
  purchasePrice: number;
  purchaseAccount: string;
  purchaseDescription: string;
  productImageList: IProductImageList;
}

const productSchema: Schema = new Schema<IProduct>(
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
    brand: {
      type: [storeCatalogMapSchema],
      required: true
    },
    category: {
      type: [storeCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeCatalogMapSchema],
      required: false
    },
    unit: {
      type: String
    },
    sellingPrice: {
      type: Number
    },
    discountPrice: {
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
      type: {
        profile: IImageSchema,
        first: IImageSchema,
        second: IImageSchema,
        third: IImageSchema
      }
    }
  },
  { timestamps: true }
);

const Product = model<IProduct>('product', productSchema);

export default Product;
