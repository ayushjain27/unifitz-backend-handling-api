import { model, Schema, Types } from 'mongoose';

export interface ISmcInsurance {
  _id?: Types.ObjectId;
}

const smcInsuranceSchema: Schema = new Schema(
  {},
  {
    timestamps: true,
    strict: false
  }
);

const SmcInsurance = model<ISmcInsurance>('smcInsurance', smcInsuranceSchema);

export default SmcInsurance;
