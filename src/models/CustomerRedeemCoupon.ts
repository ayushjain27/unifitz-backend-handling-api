import { model, Schema } from 'mongoose';

export interface ICustomerRedeemCoupon {
  customerId: string;
  storeId: string;
  oemUserName?: string;
  rewardId?: string
}

const customerRedeemCouponSchema: Schema = new Schema<ICustomerRedeemCoupon>(
  {
    customerId: {
      type: String,
      required: true
    },
    storeId: {
      type: String,
      required: true
    },
    oemUserName: {
      type: String,
      required: true
    },
    rewardId: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

export const CustomerRedeemCoupon = model<ICustomerRedeemCoupon>(
  'customerRedeemCoupon',
  customerRedeemCouponSchema
);

export default CustomerRedeemCoupon;