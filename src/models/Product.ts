import { OverallStoreRatingResponse } from './../interfaces/store-request.interface';
import { model, Schema } from 'mongoose';
import { catalogSchema, ICatalog } from './Catalog';
// import { ICatalogMap, storeCatalogMapSchema } from './Store';

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
  _id?: string;
  storeId: string;
  offerType: OfferType;
  itemName: string;
  unit: string;
  mrp: number;
  sellingPrice: number;
  productDescription: string;
  productImages: IProductImageList;
  overallRating?: OverallStoreRatingResponse;
  productCategory?: ICatalog;
  productSubCategory?: ICatalog;
  productBrand?: ICatalog;
  isActive: boolean;
  showPrice: boolean;
  oemUserName?: string;
  allowMarketPlaceHosting: boolean;
}

const productSchema: Schema = new Schema<IProduct>(
  {
    storeId: {
      type: String,
      required: true
    },
    oemUserName: {
      type: String
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
    productCategory: {
      type: catalogSchema
    },
    productSubCategory: {
      type: catalogSchema
    },
    productBrand: {
      type: catalogSchema
    },
    allowMarketPlaceHosting: {
      type: Boolean,
      default: false
    },

    unit: {
      type: String
    },
    sellingPrice: {
      type: Number
    },
    mrp: {
      type: Number,
      required: true
    },
    productDescription: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true
    },
    showPrice: {
      type: Boolean,
      default: true
    },

    productImages: {
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
