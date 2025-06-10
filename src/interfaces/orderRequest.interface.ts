import { IEmployeeStatus } from '../models/DistributorOrderManagement';
import { ICartInfo } from '../models/UserOrderManagement';

export interface OrderRequest {
  phoneNumber: string;
  userRole: string;
  items: ICartInfo[];
  shippingAddress: string;
  totalAmount: number;
}

export interface OrderStatusRequest {
  distributorId: string;
  orderId: string;
  cartId: string;
  status: string;
  cancelReason: string;
  courierCompanyName?: string;
  trackingNumber?: string;
  deliveryPartner?: string;
  deliveryType?: string;
  trackingLink?: string;
  selectedVehicleType?: string;
  employeeStatus: IEmployeeStatus;
}
