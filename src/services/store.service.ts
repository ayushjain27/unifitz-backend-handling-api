import { injectable } from 'inversify';
import { Types } from 'mongoose';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import {
  OverallStoreRatingResponse,
  StoreDocUploadRequest,
  StoreRequest,
  StoreResponse,
  StoreReviewRequest
} from '../interfaces';
import Store, { IStore } from '../models/Store';
import StoreReview from '../models/Store-Review';
import User, { IUser } from '../models/User';
import DeviceFcm, { IDeviceFcm } from '../models/DeviceFcm';
import Request from '../types/request';
import { S3Service } from './s3.service';
import { NotificationService } from './notification.service';

@injectable()
export class StoreService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private notificationService = container.get<NotificationService>(
    TYPES.NotificationService
  );
  async create(storeRequest: StoreRequest): Promise<IStore> {
    const { storePayload, phoneNumber } = storeRequest;
    Logger.info('<Service>:<StoreService>:<Onboarding service initiated>');
    const ownerDetails: IUser = await User.findOne({
      phoneNumber
    });
    storePayload.userId = ownerDetails._id;
    // const { category, subCategory, brand } = storePayload.basicInfo;
    // const getCategory: ICatalog = await Catalog.findOne({
    //   catalogName: category.name,
    //   parent: 'root'
    // });
    // const getSubCategory: ICatalog = await Catalog.findOne({
    //   tree: `root/${category.name}`,
    //   catalogName: subCategory.name
    // });
    // const getBrand: ICatalog = await Catalog.findOne({
    //   tree: `root/${category.name}/${subCategory.name}`,
    //   catalogName: brand.name
    // });
    // if (getCategory && getBrand) {
    //   storePayload.basicInfo.category._id = getCategory._id;
    //   storePayload.basicInfo.subCategory = subCategory;
    //   storePayload.basicInfo.brand._id = getBrand._id;
    // } else {
    //   throw new Error(`Wrong Catalog Details`);
    // }
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

    Logger.info('<Service>:<StoreService>: <Store: updating new store>');
    await Store.findOneAndUpdate(
      { storeId: storePayload.storeId },
      storePayload
    );
    Logger.info('<Service>:<StoreService>: <Store: update store successfully>');
    const updatedStore = await Store.findOne({ storeId: storePayload.storeId });
    return updatedStore;
  }

  async updateStoreStatus(statusRequest: any): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Update store status>');

    await Store.findOneAndUpdate(
      { storeId: statusRequest.storeId },
      {
        $set: {
          profileStatus: statusRequest.profileStatus,
          rejectionReason: statusRequest.rejectionReason
        }
      }
    );
    Logger.info(
      '<Service>:<StoreService>: <Store: store status updated successfully>'
    );
    const updatedStore = await Store.findOne({
      storeId: statusRequest.storeId
    });
    return updatedStore;
  }

  async sendNotificationToStore(store: IStore) {
    Logger.info(
      '<Service>:<StoreService>:<Sending notification to store owner>'
    );
    // const ownerDetails: IUser = await User.findOne({
    //   _id: store.userId
    // }).lean();
    // if (ownerDetails) {
    //   const deviceFcmDetails: IDeviceFcm = await DeviceFcm.findOne({
    //     deviceId: ownerDetails.deviceId
    //   }).lean();
    // }
    const deviceFcmRecord = await User.aggregate([
      { $match: { _id: store.userId } },
      {
        $lookup: {
          from: 'device_fcms',
          localField: 'deviceId',
          foreignField: 'deviceId',
          as: 'deviceFcm'
        }
      },
      {
        $unwind: '$deviceFcm'
      }
    ]);
    Logger.info(JSON.stringify(deviceFcmRecord));
    if (Array.isArray(deviceFcmRecord) && deviceFcmRecord.length > 0) {
      const selectedUserRecord = deviceFcmRecord[0];
      const fcmToken: string = selectedUserRecord.deviceFcm.fcmToken;
      const title =
        store.profileStatus === 'ONBOARDED'
          ? 'Congratulations! You are Onboarded successfully.'
          : 'Sorry, you have been Rejected';
      const body =
        store.profileStatus === 'ONBOARDED'
          ? 'Party hard. Use Service plug to checkout more features'
          : store.rejectionReason;
      const notificationParams = {
        fcmToken,
        payload: {
          notification: {
            title,
            body
          }
        }
      };
      return await this.notificationService.sendNotification(
        notificationParams
      );
    }
    return null;
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
  async searchAndFilter(
    storeName: string,
    category: string,
    subCategory: string[],
    brand: string
  ): Promise<StoreResponse[]> {
    Logger.info(
      '<Service>:<StoreService>:<Search and Filter stores service initiated>'
    );
    const query = {
      'basicInfo.businessName': new RegExp(storeName, 'i'),
      'basicInfo.brand.name': brand,
      'basicInfo.category.name': category,
      'basicInfo.subCategory.name': { $in: subCategory },
      profileStatus: 'ONBOARDED'
    };
    if (!brand) {
      delete query['basicInfo.brand.name'];
    }
    if (!category) {
      delete query['basicInfo.category.name'];
    }
    if (!subCategory || subCategory.length === 0) {
      delete query['basicInfo.subCategory.name'];
    }
    if (!storeName) {
      delete query['basicInfo.businessName'];
    }
    Logger.debug(query);
    let stores: any = await Store.find(query).lean();
    if (stores && Array.isArray(stores)) {
      stores = await Promise.all(
        stores.map(async (store) => {
          const updatedStore = { ...store };
          updatedStore.overAllRating = await this.getOverallRatings(
            updatedStore.storeId
          );
          return updatedStore;
        })
      );
    }
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
    const { storeId, fileType, placement } = storeDocUploadRequest;
    const file = req.file;
    let store: IStore;
    Logger.info('<Service>:<StoreService>:<Upload file service initiated>');
    if (storeDocUploadRequest.storeId) {
      store = await Store.findOne({ storeId });
    }
    if (!store) {
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
            storeDocuments:
              fileType === 'DOC'
                ? {
                    primary: {
                      key: placement === 'primary' ? key : '',
                      docURL: placement === 'primary' ? url : ''
                    },
                    secondary: {
                      key: placement === 'secondary' ? key : '',
                      docURL: placement === 'secondary' ? url : ''
                    }
                  }
                : {
                    primary: { key: '', docURL: '' },
                    secondary: { key: '', docURL: '' }
                  },
            storeImages:
              fileType === 'IMG'
                ? {
                    primary: {
                      key: placement === 'primary' ? key : '',
                      docURL: placement === 'primary' ? url : ''
                    },
                    secondary: {
                      key: placement === 'secondary' ? key : '',
                      docURL: placement === 'secondary' ? url : ''
                    }
                  }
                : {
                    primary: { key: '', docURL: '' },
                    secondary: { key: '', docURL: '' }
                  }
          }
        }
      );
    } else {
      fileType === 'DOC'
        ? (store.documents.storeDocuments[placement] = { key, docURL: url })
        : (store.documents.storeImages[placement] = {
            key,
            docURL: url
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
  // private async removePreviousFileRef(
  //   oldFileKey: string,
  //   fileType: string,
  //   store: IStore
  // ) {
  //   await this.s3Client.deleteFile(oldFileKey);
  //   Logger.info('<Service>:<StoreService>:<Delete file - successful>');
  //   if (fileType === 'DOC') {
  //     if (store.documents && oldFileKey) {
  //       store.documents.storeDocuments = store.documents.storeDocuments.filter(
  //         (doc) => doc.docURL !== oldFileKey
  //       );
  //     }
  //   } else if (fileType === 'IMG') {
  //     if (store.documents && oldFileKey) {
  //       store.documents.storeImages = store.documents.storeImages.filter(
  //         (img) => img.imageURL !== oldFileKey
  //       );
  //     }
  //   } else {
  //     Logger.error('<Service>:<StoreService>:<Upload file - Unknown doc type>');
  //     throw new Error('Invalid document type');
  //   }
  // }

  // private async getS3Files(documents: IDocuments) {
  //   const docBuffer = [];
  //   for (const doc of documents.storeDocuments) {
  //     const s3Response = await this.s3Client.getFile(doc.key);
  //     docBuffer.push(s3Response);
  //   }
  //   for (const img of documents.storeImages) {
  //     const s3Response = await this.s3Client.getFile(img.key);
  //     docBuffer.push(s3Response);
  //   }
  //   return docBuffer;
  // }

  async addReview(
    storeReview: StoreReviewRequest
  ): Promise<StoreReviewRequest> {
    Logger.info('<Service>:<StoreService>:<Add Store Ratings initiate>');
    const newStoreReview = new StoreReview(storeReview);
    await newStoreReview.save();
    Logger.info('<Service>:<StoreService>:<Store Ratings added successfully>');
    return newStoreReview;
  }

  async getOverallRatings(
    storeId: string
  ): Promise<OverallStoreRatingResponse> {
    Logger.info('<Service>:<StoreService>:<Get Overall Ratings initiate>');
    const storeReviews = await StoreReview.find({ storeId });
    if (storeReviews.length === 0) {
      return {
        allRatings: {
          5: 100
        },
        averageRating: 5,
        totalRatings: 1,
        totalReviews: 1
      };
    }
    let ratingsCount = 0;
    let totalRatings = 0;
    let totalReviews = 0;
    const allRatings: { [key: number]: number } = {};

    storeReviews.forEach(({ rating, review }) => {
      if (rating) totalRatings++;
      if (review) totalReviews++;
      ratingsCount = ratingsCount + rating;
      if (!allRatings[rating]) {
        allRatings[rating] = 1;
      } else {
        allRatings[rating]++;
      }
    });

    for (const key in allRatings) {
      allRatings[key] = Math.trunc(
        (allRatings[key] * 100) / storeReviews.length
      );
    }

    const averageRating = ratingsCount / storeReviews.length;
    Logger.info(
      '<Service>:<StoreService>:<Get Overall Ratings performed successfully>'
    );
    return {
      allRatings,
      averageRating,
      totalRatings,
      totalReviews
    };
  }
  /* eslint-disable */
  async getReviews(storeId: string): Promise<any[]> {
    Logger.info('<Service>:<StoreService>:<Get Store Ratings initiate>');
    const storeReviews = await StoreReview.find({ storeId }).lean();
    Logger.info(
      '<Service>:<StoreService>:<Get Ratings performed successfully>'
    );
    if (storeReviews.length === 0) {
      return [
        {
          user: {
            name: 'Service Plug',
            profilePhoto: ''
          },
          storeId,
          rating: 5,
          review:
            'Thank you for onboarding with us. May you have a wonderful experience.'
        }
      ];
    } else {
      return storeReviews;
    }
  }
}
