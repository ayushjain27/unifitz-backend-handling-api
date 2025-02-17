import { model, Schema } from 'mongoose';


export interface IReportRoadAccident {
  name: string;
  phoneNumber: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
  state: string;
  city: string;
  pincode: string;
  storeId: string;
  customerId: string;
  reportId: string;
}

export const reportRoadAccidentSchema: Schema = new Schema(
  {
    name: {
      type: String
    },
    phoneNumber: {
      type: String,
      required: true
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
    },
    storeId: {
        type: String
    },
    customerId: {
        type: String
    },
    reportId: {
        type: String,
        required: true
    }
  },
  { timestamps: true, strict: false }
);

const ReportRoadAccident = model<IReportRoadAccident>('reportRoadAccident', reportRoadAccidentSchema);

export default ReportRoadAccident;
