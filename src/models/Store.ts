import { Document, Model, model, ObjectId, Schema, Types } from 'mongoose';

export interface ICatalogMap extends Document {
  _id: ObjectId;
  name: string;
}

const storeCatalogMapSchema: Schema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  }
});

export interface IBasicInfo extends Document {
  nameSalutation: string;
  ownerName: string; //<String> {required},
  businessName: string; //<String> {required},
  registrationDate: Date; //<localeDate>{required},(NO TIME)
  brand: ICatalogMap; //<Object> {_id:, name:} {required}, _id - unique - (MD)
  category: ICatalogMap; //<Object> {_id:, name:} {required}, - (MD)
  subCategory: ICatalogMap; //<Object> {_id:, name:}{required}  - (MD),
  // businessHours for the different
}

const storeBasicInfoSchema: Schema = new Schema(
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
      type: Date,
      required: true
    },
    brand: {
      type: storeCatalogMapSchema,
      required: true
    },
    category: {
      type: storeCatalogMapSchema,
      required: true
    },
    subCategory: {
      type: storeCatalogMapSchema,
      required: true
    }
  },
  {
    _id: false
  }
);

export interface IContactInfo extends Document {
  country: { callingCode: string; coountryCode: string }; //<Object> {callingCode: 91, countryCode: IND},
  phoneNumber: { primary: string; secondary: string }; //{primary:String.,secondary:[String]},   // for multiple phone numbers
  email: string; //<String> {required},
  address: string; //<String>: {required},
  geoLocation: {
    kind: string;
    coordinates: { longitude: string; latitude: string };
  }; //<Object>: { } {not required},  // this should be in the format of {type:Point,coordinates:[longitude,latitude]}
  state: string; //<String>
  city: string;
  pincode: string; //<string>
}

const storeContactSchema: Schema = new Schema(
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
      type: {
        kind: String,
        coordinates: { longitude: String, latitude: String }
      }
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

export interface IStoreTiming extends Document {
  openTime: Date; //<TIME>,
  closeTime: Date; //<TIME>
}

const storeTimingSchema: Schema = new Schema(
  {
    openTime: {
      type: Date,
      required: true
    },
    closeTime: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

export interface IDocuments extends Document {
  storeDocuments: { key: string; docURL: string }[];
  storeImages: { key: string; imageURL: string }[];
}

const storeDocumentsSchema: Schema = new Schema(
  {
    storeDocuments: {
      type: [{ key: String, docURL: String }],
      required: true
    },
    storeImages: {
      type: [{ key: String, imageURL: String }],
      required: true
    }
  },
  {
    _id: false
  }
);

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param userId:ObjectId
 * @param storeId:string
 * @param profileStatus:string
 */
export interface IStore extends Document {
  userId: Types.ObjectId;
  storeId: string; // 6 digit unique value
  profileStatus: string;
  basicInfo: IBasicInfo;
  contactInfo: IContactInfo;
  storeTiming: IStoreTiming;
  documents: IDocuments;
  createdAt?: Date;
  updatedAt?: Date;
}

const storeSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true
    },
    storeId: {
      type: String,
      required: true,
      unique: true
    },
    profileStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'REJECTED', 'ONBOARDED', 'COMPLETED', 'ELIGIBLE'],
      default: 'PENDING'
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
    }
  },
  { timestamps: true }
);

const Store: Model<IStore> = model('stores', storeSchema);

export default Store;
