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

export interface ITargetedAudience {
  distributor: boolean;
  dealerRetailer: boolean;
  // retailers: boolean;
  consumers: boolean;
}

export const targetedAudienceSchema: Schema = new Schema(
  {
    distributor: { type: Boolean },
    dealerRetailer: { type: Boolean },
    // retailers: { type: Boolean },
    consumers: { type: Boolean }
  },
  {
    _id: false,
    strict: false
  }
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

export interface IB2BPartnersProduct {
  _id?: string;
  makeType: string;
  brandName: IVehicleBrand[];
  vehicleType: IVehicleType[];
  vehicleModel: IProductOemModel[];
  productCategory?: ICatalog[];
  productSubCategory?: ICatalog[];
  productSuggest: string;
  productDescription: string;
  features: string;
  inTheBox: string;
  warranty: string;
  materialDetails: string;
  manufactureName: string;
  madeIn: string;
  returnPolicy: string;
  isActive: boolean;
  showPrice: boolean;
  oemUserName?: string;
  manufacturePartNumber: string;
  priceDetail: IPriceDetail;
  bulkOrders: IBulkOrderDetail;
  shippingAddress: IContactInfo;
  shippingIndex: number;
  state?: IState[];
  city?: ICity[];
  // distributor?: boolean;
  // dealer?: boolean;
  selectAllStateAndCity?: boolean;
  status?: string;
  targetedAudience: ITargetedAudience;
  discount?: number;
  colorCodeList: IProductColorList[];
  employeeId?: string;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export interface IPriceDetail {
  mrp: number;
  sellingPrice: number;
  qty: number;
  // dimension: string;
  width: string;
  height: string;
  depth: string;
  weight: string;
  wholeSalePrice: number;
}

export interface IBulkOrderDetail {
  mrp: number;
  qty: number;
  // dimension: string;
  width: string;
  height: string;
  depth: string;
  weight: string;
  wholeSalePrice: number;
}

export const priceDetailSchema: Schema = new Schema<IPriceDetail>({
  mrp: {
    type: Number
  },
  sellingPrice: {
    type: Number
  },
  qty: {
    type: Number
  },
  width: {
    type: String
  },
  height: {
    type: String
  },
  depth: {
    type: String
  },
  // dimension: {
  //   type: String
  // },
  weight: {
    type: String
  },
  wholeSalePrice: {
    type: Number
  }
});

export const bulkOrdersSchema: Schema = new Schema<IBulkOrderDetail>({
  mrp: {
    type: Number
  },
  qty: {
    type: Number
  },
  width: {
    type: String
  },
  weight: {
    type: String
  },
  height: {
    type: String
  },
  depth: {
    type: String
  },
  // dimension: {
  //   type: String
  // },
  wholeSalePrice: {
    type: Number
  }
});

const partnersProductSchema: Schema = new Schema<IB2BPartnersProduct>(
  {
    makeType: {
      type: String
    },
    oemUserName: {
      type: String
    },
    brandName: {
      type: [vehicleBrandSchema]
    },
    vehicleType: {
      type: [vehicleTypeSchema]
    },
    vehicleModel: {
      type: [oemModelSchema]
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
    manufacturePartNumber: {
      type: String
    },

    showPrice: {
      type: Boolean,
      default: true
    },
    priceDetail: {
      type: priceDetailSchema
    },
    bulkOrders: {
      type: bulkOrdersSchema
    },
    shippingAddress: {
      type: storeContactSchema
    },
    shippingIndex: {
      type: Number
    },
    state: {
      type: [stateSchema]
    },
    city: {
      type: [citySchema]
    },
    // distributor: {
    //   type: Boolean,
    //   default: false
    // },
    // dealer: {
    //   type: Boolean,
    //   default: false
    // },
    selectAllStateAndCity: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.ACTIVE
    },
    discount: {
      type: Number
    },
    targetedAudience: {
      type: targetedAudienceSchema
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

export const PartnersPoduct = model<IB2BPartnersProduct>(
  'partnersproducts',
  partnersProductSchema
);
