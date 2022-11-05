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
export interface IAdmin {
  _id?: Types.ObjectId | string;
  nameSalutation: string;
  ownerName: string;
  businessName: string;
  registrationDate: Date;
  companyType: string;
  email: string;
  category: ICatalogMap[];
  subCategory: ICatalogMap[];
  contactInfo: IContactInfo;
  companyLogo: { key: string; docURL: string };
  userName: string;
  userId: string;
  password: string;
  role: string;
  isFirstTimeLoggedIn?: boolean;
  generatedPassword?: string;
}

export enum CompanyType {
  Manufacturer = 'Manufacturer',
  Importer = 'Importer',
  Distributer = 'Distributer',
  Exporter = 'Exporter'
}

export enum AdminRole {
  ADMIN = 'ADMIN',
  OEM = 'OEM'
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
    registrationDate: {
      type: Date
    },
    email: {
      type: String
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
    contactInfo: {
      type: storeContactSchema
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
    }
  },
  { timestamps: true, strict: false }
);

const Admin = model<IAdmin>('admin_user', adminSchema);

export default Admin;
