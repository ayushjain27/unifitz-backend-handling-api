import { injectable } from 'inversify';
import { Types } from 'mongoose';
import Request from '../types/request';
import fs from 'fs';

import {
  StoreDocUploadRequest,
  StoreRequest,
  StoreResponse
} from '../interfaces';
import Logger from '../config/winston';
import Catalog, { ICatalog } from '../models/Catalog';
import Store, { IDocuments, IStore } from '../models/Store';
import User, { IUser } from '../models/User';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import { S3Service } from './s3.service';

@injectable()
export class StoreService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  async create(storeRequest: StoreRequest): Promise<IStore> {
    const { storePayload, phoneNumber } = storeRequest;
    Logger.info('<Service>:<StoreService>:<Onboarding service initiated>');
    const ownerDetails: IUser = await User.findOne({
      phoneNumber
    });
    storePayload.userId = ownerDetails._id;
    const { category, subCategory, brand } = storePayload.basicInfo;
    const getCategory: ICatalog = await Catalog.findOne({
      catalogName: category.name,
      parent: 'root'
    });
    const getSubCategory: ICatalog = await Catalog.findOne({
      tree: `root/${category.name}`,
      catalogName: subCategory.name
    });
    const getBrand: ICatalog = await Catalog.findOne({
      tree: `root/${category.name}/${subCategory.name}`,
      catalogName: brand.name
    });
    try {
      storePayload.basicInfo.category._id = getCategory._id;
      storePayload.basicInfo.subCategory._id = getSubCategory._id;
      storePayload.basicInfo.brand._id = getBrand._id;
    } catch (err) {
      Logger.error(`Wrong Catalog Details`);
      throw err;
    }
    const lastCreatedStoreId = await Store.find({})
      .sort({ createdAt: 'desc' })
      .select('storeId')
      .limit(1)
      .exec();

    const storeId: number = !lastCreatedStoreId[0]
      ? new Date().getFullYear() * 100
      : +lastCreatedStoreId[0].storeId + 1;
    Logger.info(
      '<Route>:<StoreService>: <Store onboarding: creating new store>'
    );
    storePayload.storeId = '' + storeId;
    // const newStore = new Store(storePayload);
    const newStore = await Store.create(storePayload);
    Logger.info(
      '<Service>:<StoreService>: <Store onboarding: created new store successfully>'
    );
    return newStore;
  }
  async update(storeRequest: StoreRequest): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Update store service initiated>');
    const { storePayload } = storeRequest;
    const { category, subCategory, brand } = storePayload.basicInfo;
    if (category && subCategory && brand) {
      const getCategory: ICatalog = await Catalog.findOne({
        catalogName: category.name,
        parent: 'root'
      });
      const getSubCategory: ICatalog = await Catalog.findOne({
        tree: `root/${category.name}`,
        catalogName: subCategory.name
      });
      const getBrand: ICatalog = await Catalog.findOne({
        tree: `root/${category.name}/${subCategory.name}`,
        catalogName: brand.name
      });
      try {
        storePayload.basicInfo.category._id = getCategory._id;
        storePayload.basicInfo.subCategory._id = getSubCategory._id;
        storePayload.basicInfo.brand._id = getBrand._id;
      } catch (err) {
        Logger.error(`Wrong Catalog Details`);
        throw err;
      }
    }
    Logger.info('<Service>:<StoreService>: <Store: updating new store>');
    await Store.findOneAndUpdate(
      { storeId: storePayload.storeId },
      storePayload
    );
    Logger.info('<Service>:<StoreService>: <Store: update store successfully>');
    const updatedStore = await Store.findOne({ storeId: storePayload.storeId });
    return updatedStore;
  }
  async getById(storeId: string): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by Id service initiated>'
    );
    const storeResponse: StoreResponse[] = await Store.find({
      storeId: storeId
    });
    return storeResponse;
  }
  async getAll(): Promise<StoreResponse[]> {
    Logger.info('<Service>:<StoreService>:<Get all stores service initiated>');
    const stores = await Store.find({});
    return stores;
  }

  async getByOwner(userId: string): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by owner service initiated>'
    );
    const objId = new Types.ObjectId(userId);
    const stores = await Store.find({ userId: objId });
    return stores;
  }

  async uploadFile(
    storeDocUploadRequest: StoreDocUploadRequest,
    req: Request
  ): Promise<{ message: string }> {
    const { storeId, fileType } = storeDocUploadRequest;
    const file = req.file;
    console.log("---------------------");
    console.log("inside store s3 filereq body is", req.body, req.file);
    console.log("storeDocUploadReg is -------", storeDocUploadRequest);
    console.log("---------------------")
    let store: IStore;
    Logger.info('<Service>:<StoreService>:<Upload file service initiated>');
    if (storeDocUploadRequest.storeId) {
      store = await Store.findOne({ storeId });
    }
    if (!store) {
      console.log("no store found.... so bad is -------");

      Logger.error(
        '<Service>:<StoreService>:<Upload file - store id not found>'
      );
      throw new Error('Store not found');
    }
    // if (oldFileKey) {
    //   await this.removePreviousFileRef(oldFileKey, fileType, store);
    // }
    const { key, url } = await this.s3Client.uploadFile(
      storeId,
      file.originalname,
      file.buffer
    );
    Logger.info('<Service>:<StoreService>:<Upload file - successful>');
    //initializing documents document if absent in store details
    if (!store.documents) {
      await Store.findOneAndUpdate(
        { storeId },
        {
          documents: {
            storeDocuments: fileType === 'DOC' ? [{ key, docURL: url }] : [],
            storeImages: fileType === 'IMG' ? [{ key, imageURL: url }] : []
          }
        }
      );
    } else {
      fileType === 'DOC'
        ? store.documents.storeDocuments.push({
            key,
            docURL: url
          })
        : store.documents.storeImages.push({
            key,
            imageURL: url
          });
      await Store.findOneAndUpdate(
        { storeId },
        {
          documents: {
            storeDocuments: store.documents.storeDocuments,
            storeImages: store.documents.storeImages
          }
        }
      );
    }
    return {
      message: 'File upload successful'
    };
  }
  private async removePreviousFileRef(
    oldFileKey: string,
    fileType: string,
    store: IStore
  ) {
    await this.s3Client.deleteFile(oldFileKey);
    Logger.info('<Service>:<StoreService>:<Delete file - successful>');
    if (fileType === 'DOC') {
      if (store.documents && oldFileKey) {
        store.documents.storeDocuments = store.documents.storeDocuments.filter(
          (doc) => doc.docURL !== oldFileKey
        );
      }
    } else if (fileType === 'IMG') {
      if (store.documents && oldFileKey) {
        store.documents.storeImages = store.documents.storeImages.filter(
          (img) => img.imageURL !== oldFileKey
        );
      }
    } else {
      Logger.error('<Service>:<StoreService>:<Upload file - Unknown doc type>');
      throw new Error('Invalid document type');
    }
  }

  private async getS3Files(documents: IDocuments) {
    const docBuffer = [];
    for (const doc of documents.storeDocuments) {
      const s3Response = await this.s3Client.getFile(doc.key);
      docBuffer.push(s3Response);
    }
    for (const img of documents.storeImages) {
      const s3Response = await this.s3Client.getFile(img.key);
      docBuffer.push(s3Response);
    }
    return docBuffer;
  }
}
