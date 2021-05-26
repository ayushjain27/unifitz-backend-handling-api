import { Types } from 'mongoose';
import { IStore } from '../models/Store';

export interface StoreRequest {
  phoneNumber: string;
  storePayload: IStore;
}

export interface StoreResponse extends IStore {
  docsResponse?: unknown;
}

export interface StoreDocUploadRequest {
  storeId: string;
  fileName?: string;
  fileBuffer?: Buffer;
  fileExtension?: string;
  fileType: 'DOC' | 'IMG';
  placement: 'primary' | 'secondary';
  oldFileKey?: string;
}

export interface StoreReviewRequest {
  userId: Types.ObjectId;
  storeId: string;
  review: string;
  rating: number;
}

export interface OverallStoreRatingResponse {
  allRatings: { [key: number]: number };
  averageRating: number;
  totalRatings: number;
  totalReviews: number;
}

export interface StoreReviewResponse {
  userId: Types.ObjectId;
  storeId: string;
  review: string;
  rating: number;
}
