import { ICartInfo } from "../models/UserOrderManagement";

export interface OrderRequest {
    phoneNumber: string;
    userRole: string;
    items: ICartInfo[];
    shippingAddress: string;
    totalAmount: number;
  }
  