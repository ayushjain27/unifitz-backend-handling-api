import { model, Schema } from 'mongoose';

export interface ISparePostStatus {
  status: string;
  comment: string;
  oemUserName: string;
  sparePostId: string;
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
      }
  },
  { timestamps: true }
);

export const SparePostStatus = model<ISparePostStatus>(
  'sparepoststatus',
  sparePostStatus
);
