import { IStore } from "../models/Store";

export interface StoreRequest {
    phoneNumber: string;
    storePayload:IStore
  }