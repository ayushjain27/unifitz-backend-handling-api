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

export interface VerifyAadharRequest {
  clientId: string;
  otp: string;
  storeId?: string;
}
