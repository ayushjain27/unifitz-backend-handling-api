import { ICatalogMap } from '../models/Store';

export interface AdBannerUploadRequest {
  title: string;
  description: string;
  altText?: string;
  status?: string;
  userType: string;
  geoLocation: {
    type: string;
    coordinates: number[];
  };
  location: string;
  distance: string;
  bannerPlace: string;
  bannerPosition: string;
  category: ICatalogMap[];
  subCategory: ICatalogMap[];
}
