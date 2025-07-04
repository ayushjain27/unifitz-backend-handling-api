import { Types } from 'mongoose';
import { IUser } from '../models/Store-Review';
import { IStore } from '../models/Store';
import { DocType } from '../enum/docType.enum';

export interface StoreRequest {
  phoneNumber: string;
  storePayload: IStore;
}

export interface StoreResponse extends IStore {
  docsResponse?: unknown;
}

export interface StoreReviewRequest {
  userId: Types.ObjectId;
  user: IUser;
  storeId: string;
  customerId: string;
  review: string;
  rating: number;
}

export interface OverallStoreRatingResponse {
  allRatings: { [key: number]: number };
  averageRating: string | number;
  totalRatings: number;
  totalReviews: number;
}

export interface StoreReviewResponse {
  userId: Types.ObjectId;
  storeId: string;
  review: string;
  rating: number;
}

export interface VerifyBusinessRequest {
  documentNo: string;
  documentType: DocType;
  storeId?: string;
}
export interface VerifyCustomerRequest {
  documentNo: string;
  documentType: DocType;
  customerId?: string;
}

export interface ApproveBusinessVerifyRequest {
  documentType: DocType;
  storeId?: string;
  verificationDetails: object;
  gstAdhaarNumber: string;
}

export interface ApproveUserVerifyRequest {
  documentType: DocType;
  phoneNumber?: string;
  verificationDetails: object;
  gstAdhaarNumber: string;
}

export interface VerifyAadharUserRequest {
  clientId: string;
  otp: string;
  phoneNumber: string;
  gstAdhaarNumber: string;
}

export interface VerifyAadharRequest {
  clientId: string;
  otp: string;
  storeId: string;
  gstAdhaarNumber: string;
}

export interface VerifyB2BPartnersRequest {
  documentNo: string;
  documentType: DocType;
}

export interface DistributedPartnersReviewRequest {
  userName: string;
  ownerName: string;
  review: string;
  rating: number;
  storeId: string;
}

export interface PartnersProductStoreRatingResponse {
  allRatings: { [key: number]: number };
  averageRating: string | number;
  totalRatings: number;
  totalReviews: number;
}

export interface UserPaymentRequest {
  purpose: string;
  storeId: string;
  customerId: string;
  subscriptionId: string;
}
export interface ParkAssistUserRequest {
  senderId: string;
  receiverId: string;
  vehicleNumber: string;
  platform: string;
  date: Date;
}
export interface ParkAssistChatRequest {
  senderId: string;
  receiverId: string;
  message: string;
  vehicleNumber: string;
  platform: string;
}
