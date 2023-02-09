import { model, Schema } from 'mongoose';

export enum EnquiryType {
  ELECTRIC_VEHICLE = 'ELECTRIC_VEHICLE',
  PRODUCT_SALES = 'PRODUCT_SALES'
}

export enum EnquiryStatus {
  CREATED = 'CREATED',
  REJECTED = 'REJECTED',
  PASSED_TO_PARTNER = 'PASSED_TO_PARTNER',
  CLOSED = 'CLOSED'
}

export interface INotes {
  message: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnquiry {
  enquiryType: EnquiryType;
  enquiryFormData: unknown;
  status: EnquiryStatus;
  notes: INotes[];
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

const enquirySchema: Schema = new Schema<IEnquiry>(
  {
    enquiryType: {
      type: String,
      enum: EnquiryStatus
    },
    enquiryFormData: {
      type: Schema.Types.Mixed
    },
    status: {
      type: String,
      enum: EnquiryStatus
    },
    notes: {
      type: [notesSchema]
    }
  },
  { timestamps: true, strict: false }
);

const Enquiry = model<IEnquiry>('enquiry', enquirySchema);

export default Enquiry;
