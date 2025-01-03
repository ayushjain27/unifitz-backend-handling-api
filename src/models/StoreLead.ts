import { model, ObjectId, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
export interface ICatalogMap {
  _id?: ObjectId;
  name: string;
}

export const storeLeadCatalogMapSchema: Schema = new Schema({
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

export enum StoreLeadProfileStatus {
  PENDING_FOR_VERIFICATION = 'PENDING_FOR_VERIFICATION',
  CREATED = 'CREATED',
  VERIFIED = 'VERIFIED',
  FOLLOWUP = 'FOLLOWUP',
  DELETED = 'DELETED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface IBasicInfo {
  nameSalutation: string;
  ownerName: string;
  businessName: string;
  registrationDate: Date;
  userPhoneNumber: string;
  brand: ICatalogMap[];
  category: ICatalogMap[];
  subCategory: ICatalogMap[];
  language: ILanguage[];
  authorizationType: string;
  detailingType: string;
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
    brand: {
      type: [storeLeadCatalogMapSchema],
      required: true
    },
    category: {
      type: [storeLeadCatalogMapSchema],
      required: true
    },
    subCategory: {
      type: [storeLeadCatalogMapSchema],
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
  country: { callingCode: string; countryCode: string };
  phoneNumber: { primary: string; secondary: string };
  email: string;
  address: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
  state: string;
  city: string;
  pincode: string;
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
      type: new Schema({
        primary: { type: String, required: true },
        secondary: { type: String }
      })
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
  },
  {
    _id: false,
    strict: false
  }
);

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param userId:ObjectId
 * @param profileStatus:string
 */
export interface IStore {
  _id?: Types.ObjectId;
  employeeId?: string;
  basicInfo: IBasicInfo;
  contactInfo: IContactInfo;
  storeTiming: IStoreTiming;
  documents: IDocuments;
  createdAt?: Date;
  updatedAt?: Date;
  slug?: string;
  overAllRating?: any;
  isVerified?: boolean;
  missingItem?: string;
  verificationDetails?: IVerificationDetails;
  userName: string;
  videoUrl: string;
}

const storeSchema: Schema = new Schema<IStore>({
  employeeId: {
    type: String
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
  videoUrl: {
    type: String
  },
  slug: {
    type: String
  },
  userName: {
    type: String
  }
});

export interface INotes {
  message: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreLead {
  store: IStore;
  notes: INotes[];
  status: StoreLeadProfileStatus;
  rejectionReason: string;
  followUpDate: Date;
  approveId: string;
  approveDate: Date;
}

export const notesSchema: Schema = new Schema<INotes>(
  {
    message: {
      type: String,
      required: true
    },
    createdBy: {
      type: String
    }
  },
  { timestamps: true }
);

const storeLeadGenerationSchema: Schema = new Schema<IStoreLead>(
  {
    store: {
      type: storeSchema,
      required: true
    },

    notes: {
      type: [notesSchema]
    },
    status: {
      type: String,
      required: true,
      enum: StoreLeadProfileStatus,
      default: StoreLeadProfileStatus.PENDING_FOR_VERIFICATION
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    followUpDate: {
      type: Date
    },
    approveId: {
      type: String
    },
    approveDate: {
      type: Date
    }
  },
  { timestamps: true, strict: false }
);

const StoreLead = model<IStoreLead>('storeleads', storeLeadGenerationSchema);

export default StoreLead;
