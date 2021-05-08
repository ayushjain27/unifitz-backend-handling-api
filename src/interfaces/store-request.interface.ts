import { IStore } from '../models/Store';

export interface StoreRequest {
  phoneNumber: string;
  storePayload: IStore;
}

export interface StoreResponse extends IStore {
  docsResponse?: any;
}

export interface StoreDocUploadRequest {
  storeId: string;
  fileName: string;
  fileBuffer: Buffer;
  fileExtension: string;
  fileType: 'DOC' | 'IMG';
  oldFileKey?: string;
}
