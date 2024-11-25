import { ICartInfo } from '../models/UserOrderManagement';

export interface OrderRequest {
  phoneNumber: string;
  userRole: string;
  items: ICartInfo[];
  shippingAddress: string;
  totalAmount: number;
}

export interface OrderStatusRequest {
  orderId: string;
  cartId: string;
  deliveryDate: string;
  status: string;
}
