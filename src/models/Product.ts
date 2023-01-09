import { OverallStoreRatingResponse } from './../interfaces/store-request.interface';
import { model, Schema } from 'mongoose';
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
  storeId: string;
  offerType: OfferType;
  itemName: string;
  mrp: number;
  sellingPrice: number;
  productDescription: string;
  productImageList: IProductImageList;
  overallRating?: OverallStoreRatingResponse;
  isActive: boolean;
  showPrice: boolean;
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
    // brand: {
    //   type: [storeCatalogMapSchema],
    //   required: true
    // },
    // category: {
    //   type: [storeCatalogMapSchema],
    //   required: true
    // },
    // subCategory: {
    //   type: [storeCatalogMapSchema],
    //   required: false
    // },
    // unit: {
    //   type: String
    // },
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
    // discountPrice: {
    //   type: Number
    // },
    // salesAccount: {
    //   type: String
    // },
    // salesDescription: {
    //   type: String
    // },
    // purchasePrice: {
    //   type: Number
    // },
    // purchaseAccount: {
    //   type: String
    // },
    // purchaseDescription: {
    //   type: String
    // },
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
