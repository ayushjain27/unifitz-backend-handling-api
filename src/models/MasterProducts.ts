import { model, Schema, ObjectId } from 'mongoose';
import { catalogSchema, ICatalog } from './Catalog';
import { IContactInfo, storeContactSchema } from './Store';

export interface IProductOemModel {
  name: string;
  value: string;
}

export const oemModelSchema: Schema = new Schema(
  { name: { type: String }, value: { type: String } },
  { _id: false, strict: false }
);

export interface IFuelType {
  name: string;
}
export const fuelTypeSchema: Schema = new Schema(
  { name: { type: String } },
  { _id: false, strict: false }
);

export interface IProductOemList {
  oemBrand: string;
  oemModel: IProductOemModel[];
  partNumber: string;
  engineSize: string;
  startYear: Date;
  endYear: Date;
  variants: string;
  fuelType: IFuelType[];
}
export const ProductOemListSchema: Schema = new Schema(
  {
    oemBrand: { type: String },
    oemModel: { type: [oemModelSchema] },
    partNumber: { type: String },
    engineSize: { type: String },
    startYear: { type: Date },
    endYear: { type: Date },
    variants: { type: String },
    fuelType: { type: [fuelTypeSchema] }
  },
  { _id: false, strict: false }
);

export interface IProductColorList {
  color?: string;
  colorName?: string;
  oemPartNumber?: string;
  skuNumber?: string;
  manufacturerPartNumber?: string;
  image1: { key: string; docURL: string };
  image2: { key: string; docURL: string };
  image3: { key: string; docURL: string };
  oemList: IProductOemList[];
}

export const ProductColorListSchema: Schema = new Schema(
  {
    color: { type: String },
    colorName: { type: String },
    oemPartNumber: { type: String },
    skuNumber: { type: String },
    manufacturerPartNumber: { type: String },
    image1: { type: { key: String, docURL: String } },
    image2: { type: { key: String, docURL: String } },
    image3: { type: { key: String, docURL: String } },
    oemList: { type: [ProductOemListSchema] }
  },
  { _id: false, strict: false }
);

export interface IState {
  name: string;
}
export const stateSchema: Schema = new Schema(
  {
    name: {
      type: String
    }
  },
  {
    _id: false,
    strict: false
  }
);

export const citySchema: Schema = new Schema(
  {
    name: {
      type: String
    },
    value: {
      type: String
    }
  },
  {
    _id: false,
    strict: false
  }
);

export interface ICity {
  name: string;
  value: string;
}

export interface IPincode {
  name: string;
}
export const pincodeSchema: Schema = new Schema(
  { name: { type: String } },
  { _id: false, strict: false }
);

export interface IVehicleType {
  name: string;
}
export const vehicleTypeSchema: Schema = new Schema(
  { name: { type: String } },
  { _id: false, strict: false }
);

export interface IVehicleBrand {
  catalogName: string;
}
export const vehicleBrandSchema: Schema = new Schema(
  { catalogName: { type: String } },
  { _id: false, strict: false }
);

export interface IMasterProducts {
  _id?: string;
  productCategory?: ICatalog[];
  productSubCategory?: ICatalog[];
  vehicleType: IVehicleType[];
  makeType: string;
  manufactureName: string;
  productSuggest: string;
  productDescription: string;
  features: string;
  inTheBox: string;
  warranty: string;
  materialDetails: string;
  madeIn: string;
  returnPolicy: string;
  oemUserName?: string;
  colorCodeList: IProductColorList[];
  employeeId?: string;
}

const masterProductsSchema: Schema = new Schema<IMasterProducts>(
  {
    makeType: {
      type: String
    },
    oemUserName: {
      type: String
    },
    vehicleType: {
      type: [vehicleTypeSchema]
    },
    productCategory: {
      type: [catalogSchema]
    },
    productSubCategory: {
      type: [catalogSchema]
    },
    productSuggest: {
      type: String
    },
    productDescription: {
      type: String
    },
    features: {
      type: String
    },
    inTheBox: {
      type: String
    },
    warranty: {
      type: String
    },
    materialDetails: {
      type: String
    },
    manufactureName: {
      type: String
    },
    madeIn: {
      type: String
    },
    returnPolicy: {
      type: String
    },
    colorCodeList: {
      type: [ProductColorListSchema]
    },
    employeeId: {
      type: String
    }
  },
  { timestamps: true }
);

export const MasterProduct = model<IMasterProducts>(
  'masterProducts',
  masterProductsSchema
);
