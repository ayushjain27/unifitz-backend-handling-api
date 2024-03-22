import { Document, model, Schema, Types } from 'mongoose';

export interface IContactUs extends Document {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  message: string;
}

const contactUsSchema: Schema = new Schema(
  {
    firstName: {
      type: String
    },
    lastName: {
      type: String
    },
    phoneNumber: {
      type: String
    },
    email: {
      type: String
    },
    message: {
      type: String
    }
  },
  { timestamps: true }
);

const ContactUsModel = model<IContactUs & Document>(
  'contactus',
  contactUsSchema
);

export default ContactUsModel;
