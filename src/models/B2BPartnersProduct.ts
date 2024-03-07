import { model, Schema, ObjectId } from 'mongoose';
import { catalogSchema, ICatalog } from './Catalog';
import { IContactInfo, storeContactSchema } from './Store';

// export enum OfferType {
//   PRODUCT = 'product',
//   SERVICE = 'service'
// }

export enum ProductType {
  OEM = 'OEM',
  AFTER_MARKET = 'AFTER MARKET'
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

export interface IVehicleType extends Document {
  _id: ObjectId;
  name: string;
}

export interface IB2BPartnersProduct {
  _id?: string;
  //   offerType: OfferType;
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
  oemUserName?: string;
  productType: ProductType;
  vehicleType: IVehicleType[];
  startYear: Date;
  endYear: Date;
  modelName: string;
  manufactureName: string;
  oemBrandPartNumber: string;
  manufacturePartNumber: string;
  priceDetail: IPriceDetail;
  bulkOrders: IBulkOrderDetail;
  shippingAddress: IContactInfo;
  moreDetail: IMoreDetail;
  status?: string;
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

export interface IMoreDetail {
  features: string;
  warranty: string;
  materialDetails: string;
  colour: string;
  madeIn: string;
}

export interface IPriceDetail {
  mrp: number;
  sellingPrice: number;
  productDescription: string;
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
  wholeSalePrice: number;
}

export const vehicleTypeSchema: Schema = new Schema<IVehicleType>({
  name: {
    type: String
  }
});

export const moreDetailSchema: Schema = new Schema<IMoreDetail>({
  features: {
    type: String
  },
  warranty: {
    type: String
  },
  materialDetails: {
    type: String
  },
  colour: {
    type: String
  },
  madeIn: {
    type: String
  }
});

export const priceDetailSchema: Schema = new Schema<IPriceDetail>({
  mrp: {
    type: Number
  },
  sellingPrice: {
    type: Number
  },
  productDescription: {
    type: String
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
    // offerType: {
    //   type: String,
    //   enum: OfferType,
    //   required: true
    // },
    oemUserName: {
      type: String
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

    productType: {
      type: String,
      enum: ProductType
    },
    vehicleType: {
      type: [vehicleTypeSchema]
    },
    startYear: {
      type: Date
    },
    endYear: {
      type: Date
    },
    modelName: {
      type: String
    },
    manufactureName: {
      type: String
    },
    oemBrandPartNumber: {
      type: String
    },
    manufacturePartNumber: {
      type: String
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
    moreDetail: {
      type: moreDetailSchema
    },
    status: {
      type: String,
      enum: ProductStatus,
      default: ProductStatus.ACTIVE
    }
  },
  { timestamps: true }
);

export const PartnersPoduct = model<IB2BPartnersProduct>(
  'partnersproduct',
  partnersProductSchema
);
