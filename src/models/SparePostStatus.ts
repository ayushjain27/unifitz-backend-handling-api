import { model, Schema } from 'mongoose';

export interface ISparePostStatus {
  status: string;
  comment: string;
  oemUserName: string;
  sparePostId: string;
  employeeId?: string;
  createdOemUser?: string;
}

const sparePostStatus: Schema = new Schema<ISparePostStatus>(
  {
    status: {
      type: String
    },
    sparePostId: {
      type: String
    },
    oemUserName: {
      type: String
    },
    comment: {
      type: String
    },
    employeeId: {
      type: String
    },
    createdOemUser: {
      type: String
    }
  },
  { timestamps: true }
);

export const SparePostStatus = model<ISparePostStatus>(
  'spares',
  sparePostStatus
);
