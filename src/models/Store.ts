import { model, ObjectId, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
import { emergencyContactDetailsSchema, IEmergencyContactDetails } from './EmergencyContactDetails';
export interface ICatalogMap {
  _id?: ObjectId;
  name: string;
}

export const storeCatalogMapSchema: Schema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: false
  },
  name: {
    type: String,
    required: true
  }
});

export interface ILanguage {
  name: string;
}

export const languageSchema: Schema = new Schema({
  name: {
    type: String
  }
});

export interface IPaymentDetails {
  startDate: Date;
  endDate: Date;
  paymentDetails: string;
  amount: string;
  paymentId: string;
  paymentDate: Date;
}

export const paymentDetailsSchema: Schema = new Schema(
  {
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    paymentDetails: {
      type: String,
    },
    amount: {
      type: String,
    },
    paymentId: {
      type: String
    },
    paymentDate: {
      type: Date
    }
  },
  {
    timestamps: true,
  }
);

export enum StoreProfileStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ONBOARDED = 'ONBOARDED',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED'
}

export interface IBasicInfo {
  nameSalutation: string;
  ownerName: string; //<String> {required},
  businessName: string; //<String> {required},
  registrationDate: Date; //<localeDate>{required},(NO TIME)
  userPhoneNumber: string;
  brand: ICatalogMap[]; //<Object> {_id:, name:} {required}, _id - unique - (MD)
  category: ICatalogMap[]; //<Object> {_id:, name:} {required}, - (MD)
  subCategory: ICatalogMap[]; //<Array> {_id:, name:}{required}  - (MD),
  language: ILanguage[];
  authorizationType: string;
  detailingType: string;
  serviceType: string;
  // businessHours for the different
}

export const storeBasicInfoSchema: Schema = new Schema(
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
    registrationDate: {
      type: Date
    },
    userPhoneNumber: {
      type: String
    },
    authorizationType: {
      type: String
    },
    detailingType: {
      type: String
    },
    serviceType: {
      type: String
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
    language: {
      type: [languageSchema]
    }
  },
  {
    _id: false
  }
);

export interface IContactInfo {
  country: { callingCode: string; countryCode: string }; //<Object> {callingCode: 91, countryCode: IND},
  phoneNumber: { primary: string; secondary: string }; //{primary:String.,secondary:[String]},   // for multiple phone numbers
  email: string; //<String> {required},
  address: string; //<String>: {required},
  geoLocation: {
    // kind: string;
    type: string;
    coordinates: number[];
  }; //<Object>: { } {not required},  // this should be in the format of {type:Point,coordinates:[longitude,latitude]}
  state: string; //<String>
  city: string;
  pincode: string; //<string>
}

export const storeContactSchema: Schema = new Schema(
  {
    country: {
      type: {
        callingCode: String,
        countryCode: String
      }
    },
    phoneNumber: {
      type: { primary: String, secondary: String }
    },
    email: {
      type: String
    },
    address: {
      type: String
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    state: {
      type: String
    },
    city: {
      type: String
    },
    pincode: {
      type: String
    }
  },
  {
    _id: false
  }
);

storeContactSchema.index({ geoLocation: '2dsphere' });

export interface IStoreTiming {
  openTime: Date; //<TIME>,
  closeTime: Date; //<TIME>
  holiday: [string];
}

export const storeTimingSchema: Schema = new Schema(
  {
    openTime: {
      type: Date
    },
    closeTime: {
      type: Date
    },
    holiday: {
      type: [String]
    }
  },
  { _id: false, strict: false }
);

export interface IDocuments {
  profile: { key: string; docURL: string };
  storeImageList: {
    first: { key: string; docURL: string };
    second: { key: string; docURL: string };
    third: { key: string; docURL: string };
  };

  // storeDocuments: {
  //   primary: { key: string; docURL: string };
  //   secondary: { key: string; docURL: string };
  // };
  // storeImages: {
  //   primary: { key: string; docURL: string };
  //   secondary: { key: string; docURL: string };
  // };
}

export interface IVerificationDetails {
  documentType: DocType;
  gstAdhaarNumber?: string;
  verifyObj: unknown;
  verifyName: string;
  verifyAddress: string;
}

export const storeDocumentsSchema: Schema = new Schema<IDocuments>(
  {
    profile: {
      key: String,
      docURL: String
    },
    storeImageList: {
      type: {
        first: { key: String, docURL: String },
        second: { key: String, docURL: String },
        third: { key: String, docURL: String }
      }
    }
    // storeDocuments: {
    //   type: {
    //     primary: { key: String, docURL: String },
    //     secondary: { key: String, docURL: String }
    //   }
    // },
    // storeImages: {
    //   type: [{ key: String, docURL: String }]
    // type: {
    //   primary: { key: String, docURL: String },
    //   secondary: { key: String, docURL: String }
  },
  {
    _id: false,
    strict: false
  }
);

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param userId:ObjectId
 * @param storeId:string
 * @param profileStatus:string
 */
export interface IStore {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  oemUserName?: string;
  employeeId?: string;
  storeId: string; // 6 digit unique value
  profileStatus: string;
  rejectionReason: string;
  basicInfo: IBasicInfo;
  contactInfo: IContactInfo;
  storeTiming: IStoreTiming;
  documents: IDocuments;
  videoUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
  slug?: string;
  overAllRating?: any;
  isVerified?: boolean;
  missingItem?: string;
  preferredServicePlugStore?: boolean;
  verificationDetails?: IVerificationDetails;
  emergencyDetails?: IEmergencyContactDetails[];
  paymentDetails?: IPaymentDetails[];
  accessList: object;
}

const storeSchema: Schema = new Schema<IStore>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    storeId: {
      type: String,
      required: true,
      unique: true
    },
    oemUserName: {
      type: String
    },
    employeeId: {
      type: String
    },
    videoUrl: {
      type: String
    },
    profileStatus: {
      type: String,
      required: true,
      enum: StoreProfileStatus,
      default: StoreProfileStatus.DRAFT
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    basicInfo: {
      type: storeBasicInfoSchema
    },
    contactInfo: {
      type: storeContactSchema
    },
    storeTiming: {
      type: storeTimingSchema
    },
    documents: {
      type: storeDocumentsSchema
    },
    missingItem: {
      type: String
    },
    preferredServicePlugStore: {
      type: Boolean
    },
    slug: {
      type: String
    },
    emergencyDetails: {
      type: [emergencyContactDetailsSchema]
    },
    paymentDetails: {
      type: [paymentDetailsSchema]
    },
    accessList: {
      type: Object
    }
  },
  { timestamps: true, strict: false }
);

// storeSchema.index({ 'contactInfo.geoLocation': '2dsphere' }, { sparse: true });

const Store = model<IStore>('stores', storeSchema);

export default Store;
