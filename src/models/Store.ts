import { Document, Model, model, ObjectId, Schema, Types } from 'mongoose';

export interface IMasterDataMap extends Document {
  //_id: ObjectId;
  name: string;
}

const storeMasterDataMapSchema: Schema = new Schema({
  // _id: {
  //   type: Types.ObjectId,
  //   required: true
  // },
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
  brand: IMasterDataMap; //<Object> {_id:, name:} {required}, _id - unique - (MD)
  category: IMasterDataMap; //<Object> {_id:, name:} {required}, - (MD)
  subCategory: IMasterDataMap[]; //<Object> {_id:, name:}{required}  - (MD),
  // businessHours for the different
  openTime: Date; //<TIME>,
  closeTime: Date; //<TIME>
}

const storeBasicInfoSchema: Schema = new Schema({
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
    type: storeMasterDataMapSchema,
    required: true
  },
  category: {
    type: storeMasterDataMapSchema,
    required: true
  },
  subCategory: {
    type: [storeMasterDataMapSchema],
    required: true
  },
  openTime: {
    type: Date,
    required: true
  },
  closeTime: {
    type: Date,
    required: true
  }
});

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

const storeContactSchema: Schema = new Schema({
  country: {
    type: {
      callingCode: String,
      countryCode: String
    },
    required: true
  },
  phoneNumber: {
    type: { primary: String, secondary: String },
    required: true
  },
  email: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  geoLocation: {
    type: {
      kind: String,
      coordinates: { longitude: String, latitude: String }
    },
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  }
});

export interface IDocuments extends Document {
  storeDocuments: { docURL: string }[];
  storeImages: { imageURL: string }[];
}

const storeDocumentsSchema: Schema = new Schema({
  storeDocuments: {
    type: [{ docURL: String }],
    required: true
  },
  storeImages: {
    type: [{ imageURL: String }],
    required: true
  }
});

/**
 * Interface to model the Admin Schema for TypeScript.
 * @param userId:ObjectId
 * @param storeId:string
 * @param profileStatus:string
 */
export interface IStore extends Document {
  uuid: string;
  userId: ObjectId;
  storeId: number; // 6 digit unique value
  profileStatus: string;
  basicInfo: IBasicInfo;
  contactInfo: IContactInfo;
  documents: IDocuments;
  phoneNumber: string;
}

const storeSchema: Schema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      required: true
    },
    uuid: {
      type: String,
      required: true,
      unique: true
    },
    storeId: {
      type: Number,
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
      //required: true
    },
    contactInfo: {
      type: storeContactSchema
      //required: true
    },
    documents: {
      type: storeDocumentsSchema
      //required: true
    }
  },
  { timestamps: true }
);

const Store: Model<IStore> = model('stores', storeSchema);

export default Store;
