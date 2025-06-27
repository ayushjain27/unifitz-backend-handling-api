import { model, ObjectId, Schema, Types } from 'mongoose';
import { DocType } from '../enum/docType.enum';
import { emergencyContactDetailsSchema, IEmergencyContactDetails } from './EmergencyContactDetails';

export interface IPricingPlans {
  name?: string;
  price?: string;
  period?: string;
  description?: string;
  icon?: string;
  popular?: string;
  buttonText?: string;
  userName?: string;
  role?: string;
  features?: string[];
}

const pricingPlansSchema: Schema = new Schema<IPricingPlans>(
  {
    name: {
      type: String
    },
    price: {
      type: String
    },
    period: {
      type: String
    },
    description: {
      type: String
    },
    icon: {
      type: String
    },
    popular: {
      type: String
    },
    buttonText: {
      type: String
    },
    userName: {
      type: String
    },
    role: {
      type: String
    },
    features: { type: [String] }
  },
  { timestamps: true, strict: false }
);

const PricingPlans = model<IPricingPlans>('pricingPlans', pricingPlansSchema);

export default PricingPlans;
