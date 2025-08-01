import mongoose, { model, Schema } from 'mongoose';

export enum reportStatus {
  REPORTED = 'REPORTED',
  INVESTIGATING = 'INVESTIGATING',
  CLOSED = 'CLOSED'
}

export interface INotesSchema {
  _id?: string;
  message: string;
  name: string;
}

export const notesSchema: Schema = new Schema<INotesSchema>(
  {
    message: {
      type: String
    },
    name: {
      type: String
    }
  },
  { timestamps: true }
);

export interface IReport {
  _id?: string;
  storeId?: string;
  oemUserName?: string;
  customerId?: string;
  storeName?: string;
  customerName?: string;
  storePhoneNumber?: string;
  customerPhoneNumber?: string;
  notes?: INotesSchema[];
  status?: string;
  sourceType?: string;
  geoLocation: {
    // kind: string;
    type: string;
    coordinates: number[];
  };
  answers: string[];
  description?: string;
}

const reportSchema: Schema = new Schema<IReport>(
  {
    storeId: {
      type: String,
      required: true
    },
    customerId: {
      type: String,
      required: true
    },
    storePhoneNumber: {
      type: String
    },
    customerPhoneNumber: {
      type: String
    },
    storeName: {
      type: String
    },
    oemUserName: {
      type: String
    },
    customerName: {
      type: String
    },
    notes: {
      type: [notesSchema]
    },
    sourceType: {
      type: String
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    answers: [{ type: String }],
    status: {
      type: String,
      // required: true,
      enum: reportStatus,
      default: reportStatus.REPORTED
    },
    description: {
      type: String
    }
  },
  { timestamps: true }
);

const Report = model<IReport>('report', reportSchema);

export default Report;
