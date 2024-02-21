import { Document, Types, model, Schema } from 'mongoose';
import {
  ICatalogMap,
  IContactInfo,
  storeCatalogMapSchema,
  storeContactSchema
} from './Store';

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param userName:string
 * @param password:string
 * @param role:string
 * @param createdDate:Date
 */

export const businessDocumentSchema: Schema = new Schema<IDocumentImage>({
  docURL: {
    type: String
  },
  key: {
    type: String
  }
});
export const productCateoryMapSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  }
});
export const productSubCateoryMapSchema: Schema = new Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  }
});
export const gstDocumentSchema: Schema = new Schema<IGstInformation>({
  clientId: {
    type: String
  },
  gstin: {
    type: String
  },
  panNumber: {
    type: String
  },
  businessName: {
    type: String
  },
  legalName: {
    type: String
  },
  centerJurisdiction: {
    type: String
  },
  stateJurisdiction: {
    type: String
  },
  dateOfRegistration: {
    type: String
  },
  constitutionOfBusiness: {
    type: String
  },
  taxpayerType: {
    type: String
  },
  gstinStatus: {
    type: String
  },
  dateOfCancellation: {
    type: String
  },
  fieldVisitConducted: {
    type: String
  },
  natureOfCoreBusinessActivityCode: {
    type: String
  },
  natureOfCoreBusinessActivityDescription: {
    type: String
  },
  aadhaarValidation: {
    type: String
  },
  aadhaarValidationDate: {
    type: String
  },
  address: {
    type: String
  }
});

export interface IAdmin {
  _id?: Types.ObjectId | string;
  nameSalutation: string;
  ownerName: string;
  businessName: string;
  registrationDate: Date;
  companyType: string;
  category: ICatalogMap[];
  subCategory: ICatalogMap[];
  brand: ICatalogMap[];
  contactInfo: IContactInfo;
  companyLogo: { key: string; docURL: string };
  userName: string;
  userId: string;
  password: string;
  role: string;
  isFirstTimeLoggedIn?: boolean;
  generatedPassword?: string;
  status: string;
  documentImageList: IDocumentImageList;
  wareHouseInfo: IContactInfo;
  aboutUs: string;
  // businessCategory: IBusinessCategory;
  documents: IDocuments;
  productCategory: IProductCategory;
  updateCount?: string;
  lastModifyResult?: Date;
  lastLogin: Date;
}

export interface IDocumentImage {
  docURL: string;
  key: string;
}
export interface IDocumentImageList {
  logo: IDocumentImage;
  panFrontView: IDocumentImage;
  gstView: IDocumentImage;
  aadhaarFrontView: IDocumentImage;
  aadhaarBackView: IDocumentImage;
}

// export interface IBusinessCategory {
//   category: ICatalogMap[];
//   subCategory: ICatalogMap[];
//   brand: ICatalogMap[];
//   marketBrand: string;
// }

export interface IProductCatagoryMap {
  name: string;
}

export interface IProductSubCatagoryMap {
  name: string;
  category: string;
}

export interface IProductCategory {
  category: IProductCatagoryMap[];
  subCategory: IProductSubCatagoryMap[];
  brand: string;
}

export interface IGstInformation {
  clientId: string;
  gstin: string;
  panNumber: string;
  businessName: string;
  legalName: string;
  centerJurisdiction: string;
  stateJurisdiction: string;
  dateOfRegistration: string;
  constitutionOfBusiness: string;
  taxpayerType: string;
  gstinStatus: string;
  dateOfCancellation: string;
  fieldVisitConducted: string;
  natureOfCoreBusinessActivityCode: string;
  natureOfCoreBusinessActivityDescription: string;
  aadhaarValidation: string;
  aadhaarValidationDate: string;
  address: string;
}

export interface IDocuments {
  gstData: IGstInformation;
  panNumber: string;
  websiteUrl: string;
  businessOpenTime: string;
  businessCloseTime: string;
  memberShip: string;
  memberShipId: string;
}

export enum CompanyType {
  Manufacturer = 'Manufacturer',
  Importer = 'Importer',
  Distributer = 'Distributer',
  Dealer = 'Dealer'
}

export enum AdminRole {
  ADMIN = 'ADMIN',
  OEM = 'OEM'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED'
}

const adminSchema: Schema = new Schema<IAdmin>(
  {
    nameSalutation: {
      type: String,
      required: true
    },
    ownerName: {
      type: String,
      required: true
    },
    businessName: {
      type: String,
      required: true
    },
    documentImageList: {
      type: {
        logo: businessDocumentSchema,
        panFrontView: businessDocumentSchema,
        gstView: businessDocumentSchema,
        aadhaarFrontView: businessDocumentSchema,
        aadhaarBackView: businessDocumentSchema
      }
    },
    registrationDate: {
      type: Date
    },
    lastModifyResult: {
      type: Date
    },
    companyType: {
      type: String,
      enum: CompanyType
    },
    companyLogo: {
      key: String,
      docURL: String
    },
    category: {
      type: [storeCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeCatalogMapSchema],
      required: false
    },
    brand: {
      type: [storeCatalogMapSchema],
      required: false
    },
    contactInfo: {
      type: storeContactSchema
    },
    wareHouseInfo: {
      type: storeContactSchema
    },
    aboutUs: {
      type: String
    },
    productCategory: {
      type: {
        category: {
          type: [productCateoryMapSchema],
          required: true
        },
        subCategory: {
          type: [productSubCateoryMapSchema],
          required: false
        },
        brand: {
          type: String
        }
      }
    },
    documents: {
      gstData: gstDocumentSchema,
      panNumber: {
        type: String
      },
      websiteUrl: {
        type: String
      },
      businessOpenTime: {
        type: String,
        required: true
      },
      businessCloseTime: {
        type: String,
        required: true
      },
      memberShip: {
        type: String
      },
      memberShipId: {
        type: String
      }
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: AdminRole,
      default: 'ADMIN'
    },
    status: {
      type: String,
      enum: UserStatus,
      default: UserStatus.ACTIVE
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true, strict: false }
);

const Admin = model<IAdmin>('admin_user', adminSchema);

export default Admin;
