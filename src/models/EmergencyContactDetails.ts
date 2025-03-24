import { model, Schema } from 'mongoose';

export interface IEmergencyContactDetails {
  name: string;
  phoneNumber: string;
  relation: string;
  isPublic?: boolean;
  storeId?: string;
  customerId?: string;
}

export const emergencyContactDetailsSchema: Schema = new Schema(
  {
    name: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    relation: {
      type: String
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    storeId: {
        type: String
    },
    customerId: {
        type: String
    }
  },
  { timestamps: true, strict: false }
);

const EmergencyContactDetails = model<IEmergencyContactDetails>(
  'emergencyContactDetails',
  emergencyContactDetailsSchema
);

export default EmergencyContactDetails;
