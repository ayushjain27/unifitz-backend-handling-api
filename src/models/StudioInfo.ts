import { model, ObjectId, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
import { emergencyContactDetailsSchema, IEmergencyContactDetails } from './EmergencyContactDetails';

export interface IContactDetails {
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
}

export interface IStats {
  students: string;
  classTypes: string;
  instructors: string;
}

export const contactDetailsSchema: Schema = new Schema(
  {
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

export const statsSchema: Schema = new Schema(
  {
    students: {
      type: String,
    },
    classTypes: {
      type: String,
    },
    instructors: {
      type: String
    },
    email: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

export interface IStudioInfo {
  name?: string;
  tagline?: string;
  description?: string;
  userName?: string;
  role?: string;
  contact?: IContactDetails;
  stats?: IStats;
  hours?: Object;
}

const studioInfoSchema: Schema = new Schema<IStudioInfo>(
  {
    name: {
      type: String
    },
    tagline: {
      type: String
    },
    description: {
      type: String
    },
    userName: {
      type: String
    },
    role: {
      type: String
    },
    contact: { type: contactDetailsSchema },
    stats: { type: statsSchema },  
    hours: {
      type: Object
    }
  },
  { timestamps: true, strict: false }
);

const StudioInfo = model<IStudioInfo>('studioInfo', studioInfoSchema);

export default StudioInfo;
