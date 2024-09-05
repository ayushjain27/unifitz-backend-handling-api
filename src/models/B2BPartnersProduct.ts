import { model, Schema, ObjectId } from 'mongoose';
import { catalogSchema, ICatalog } from './Catalog';
import { IContactInfo, storeContactSchema } from './Store';

export enum ProductType {
  OEM = 'OEM',
  AFTER_MARKET = 'AFTER MARKET'
}

export interface IColorCode {
  color?: string;
  colorName?: string;
  oemPartNumber?: string;
  skuNumber?: string;
  manufacturerPartNumber?: string;
  image: { key: string; docURL: string };
}

export const colorCodeSchema: Schema = new Schema(
  {
    color: {
      type: String
    },
    colorName: {
      type: String
    },
    oemPartNumber: {
      type: String
    },
    skuNumber: {
      type: String
    },
    manufacturerPartNumber: {
      type: String
    },
    productImageList: {
      type: { key: String, docURL: String }
    }
  },
  {
    _id: false,
    strict: false
  }
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

export interface IB2BPartnersProduct {
  _id?: string;
  makeType: string;
  brandName: string;
  vehicleType: string;
  vehicleModel: string;
  variants: string;
  fuelType: string;
  oemPart: string;
  aftermarketPartSku: string;
  productCategory?: ICatalog[];
  productSubCategory?: ICatalog[];
  startYear: Date;
  endYear: Date;
  oemBrandPartNumber: string;
  partManufactureName: string;
  productSuggest: string;
  productDescription: string;
  features: string;
  inTheBox: string;
  warranty: number;
  materialDetails: string;
  colour: string;
  madeIn: string;
  skuNumber: string;
  returnPolicy: string;
  isActive: boolean;
  showPrice: boolean;
  oemUserName?: string;
  manufacturePartNumber: string;
  priceDetail: IPriceDetail;
  bulkOrders: IBulkOrderDetail;
  shippingAddress: IContactInfo;
  state?: IState[];
  city?: ICity[];
  distributor?: boolean;
  dealer?: boolean;
  selectAllStateAndCity?: boolean;
  status?: string;
  colorCode: IColorCode[];
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
      type: String,
      enum: ProductType
    },
    oemUserName: {
      type: String
    },
    brandName: {
      type: String
    },
    vehicleType: {
      type: String
    },
    vehicleModel: {
      type: String
    },
    variants: {
      type: String
    },
    fuelType: {
      type: String
    },
    oemPart: {
      type: String
    },
    aftermarketPartSku: {
      type: String
    },
    productCategory: {
      type: [catalogSchema]
    },
    productSubCategory: {
      type: [catalogSchema]
    },
    startYear: {
      type: Date
    },
    endYear: {
      type: Date
    },
    oemBrandPartNumber: {
      type: String
    },
    partManufactureName: {
      type: String
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
      type: Number
    },
    materialDetails: {
      type: String
    },
    colour: {
      type: String
    },
    madeIn: {
      type: String
    },
    skuNumber: {
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
    state: {
      type: [stateSchema]
    },
    city: {
      type: [citySchema]
    },
    distributor: {
      type: Boolean,
      default: false
    },
    dealer: {
      type: Boolean,
      default: false
    },
    selectAllStateAndCity: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.ACTIVE
    },
    colorCode: {
      type: [colorCodeSchema]
    }
  },
  { timestamps: true }
);

export const PartnersPoduct = model<IB2BPartnersProduct>(
  'partnersproduct',
  partnersProductSchema
);
