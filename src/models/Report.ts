import mongoose, { model, Schema } from 'mongoose';

export enum reportStatus {
  REPOTED = 'REPOTED',
  INVESTIGATING = 'INVESTIGATING',
  CLOSED = 'CLOSED'
}

export interface IReport {
  _id?: string;
  storeId?: string;
  customerId?: string;
  storeName?: string;
  customerName: string;
  remarks: string;
  status: string;
  sourceType: string;
  geoLocation: {
    // kind: string;
    type: string;
    coordinates: number[];
  };
  questions: {
    type: string;
    answers: string[];
  };
  reportStatus: string;
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
    storeName: {
      type: String
    },
    customerName: {
      type: String
    },
    remarks: {
      type: String,
      required: true
    },
    status: {
      type: String
    },
    sourceType: {
      type: String
    },
    geoLocation: {
      // kind: String,
      type: { type: String, default: 'Point' },
      coordinates: [{ type: Number }]
    },
    questions: {
      // kind: String,
      type: { type: String },
      answers: [{ type: String }]
    },
    reportStatus: {
      type: String,
      // required: true,
      enum: reportStatus,
      default: reportStatus.REPOTED
    }
  },
  { timestamps: true }
);

const Report = model<IReport>('report', reportSchema);

export default Report;
