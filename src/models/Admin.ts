import { Document, Model, model, Schema } from 'mongoose';
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
export interface IAdmin extends Document {
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
}

export enum CompanyType {
  Manufacturer = 'Manufacturer',
  Importer = 'Importer',
  Distributer = 'Distributer',
  Exporter = 'Exporter'
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
      enum: ['ADMIN', 'OEM'],
      default: 'ADMIN'
    }
  },
  { timestamps: true }
);

const Admin = model<IAdmin>('admin_user', adminSchema);

export default Admin;
