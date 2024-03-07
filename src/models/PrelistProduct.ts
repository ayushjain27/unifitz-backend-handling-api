import { model, Schema, ObjectId } from 'mongoose';
import { catalogSchema, ICatalog } from './Catalog';
import { IContactInfo, storeContactSchema } from './Store';

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

export interface IPrelistProduct {
  _id?: string;
  offerType: OfferType;
  itemName: string;
  unit: string;
  mrp: number;
  productDescription: string;
  productImageList: IProductImageList;
  productCategory?: ICatalog[];
  productSubCategory?: ICatalog[];
  productBrand?: string;
  isActive: boolean;
  showPrice: boolean;
  status?: string;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

const prelistProductSchema: Schema = new Schema<IPrelistProduct>(
  {
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
      type: [catalogSchema]
    },
    productSubCategory: {
      type: [catalogSchema]
    },
    productBrand: {
      type: String
    },

    unit: {
      type: String
    },
    mrp: {
      type: Number,
      required: true
    },
    productDescription: {
      type: String
    },
    showPrice: {
      type: Boolean,
      default: true
    },
    productImageList: {
      type: {
        profile: IImageSchema,
        first: IImageSchema,
        second: IImageSchema,
        third: IImageSchema
      }
    },
    status: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.ACTIVE
    }
  },
  { timestamps: true }
);

export const PrelistPoduct = model<IPrelistProduct>(
  'prelist-product',
  prelistProductSchema
);
