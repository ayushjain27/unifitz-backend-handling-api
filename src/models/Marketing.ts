import { Document, model, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';

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

export interface ICatalogMap {
  _id?: Types.ObjectId;
  name: string;
}

export const catalogMapSchema: Schema = new Schema({
  _id: {
    type: Types.ObjectId,
    required: false
  },
  name: {
    type: String,
    required: true
  }
});

export interface IMarketing extends Document {
  _id: Types.ObjectId;
  storeId: string;
  oemUserName: string;
  businessName: string;
  businessImage: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
  phoneNumber: string;
  fromDate: Date;
  endDate: Date;
  userType: string;
  selectType: string;
  state: IState[];
  city: ICity[];
  category: ICatalogMap[];
  subCategory: ICatalogMap[];
  brand: ICatalogMap[];
  fileType: string;
  websiteLink: string;
  distance: number;
  fileUrl: { key: string; docURL: string };
  youtubeUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
  status: string;
  // profileStatus: string;
  employeeId: string;
  employeeUserName: string;
  postType: string;
  postTitle: string;
  description: string;
  displayName: string;
  visitStore: boolean;
  rejectionReason: string;
}

const MarketingSchema: Schema = new Schema(
  {
    storeId: {
      type: String
    },
    oemUserName: {
      type: String
    },
    businessName: {
      type: String
    },
    businessImage: { type: String },
    geoLocation: {
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    phoneNumber: {
      type: String
    },
    fromDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    userType: {
      type: String
    },
    websiteLink: {
      type: String
    },
    selectType: {
      type: String
    },
    fileType: {
      type: String
    },
    youtubeUrl: {
      type: String
    },
    state: {
      type: [stateSchema]
    },
    city: {
      type: [citySchema]
    },
    category: {
      type: [catalogMapSchema]
    },
    subCategory: {
      type: [catalogMapSchema]
    },
    brand: {
      type: [catalogMapSchema]
    },
    distance: {
      type: Number
    },
    employeeId: {
      type: String
    },
    employeeUserName: {
      type: String
    },
    postType: {
      type: String
    },
    postTitle: {
      type: String
    },
    description: {
      type: String
    },
    displayName: {
      type: String
    },
    rejectionReason: {
      type: String
    },
    visitStore: {
      type: Boolean
    },
    status: {
      type: String,
      enum: ['ENABLED', 'DISABLED'],
      default: 'DISABLED'
    },
    // profileStatus: {
    //   type: String,
    //   enum: ['DRAFT', 'PENDING', 'ONBOARDED', 'REJECTED', 'COMPLETED'],
    //   default: 'DRAFT'
    // },
    fileUrl: { type: { key: String, docURL: String } }
  },
  { timestamps: true }
);

MarketingSchema.index({ geoLocation: '2dsphere' }, { sparse: true });

const Marketing = model<IMarketing & Document>('marketings', MarketingSchema);

export default Marketing;
