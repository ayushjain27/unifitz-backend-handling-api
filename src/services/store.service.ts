import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { StoreRequest } from '../interfaces';
import Logger from '../config/winston';
import Catalog, { ICatalog } from '../models/Catalog';
import Store, { IStore } from '../models/Store';
import User, { IUser } from '../models/User';

@injectable()
export class StoreService {
  async create(storeRequest: StoreRequest): Promise<IStore> {
    const {storePayload,phoneNumber} = storeRequest;
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
    
    const storeId:number= !lastCreatedStoreId[0]?(new Date().getFullYear())*100:+lastCreatedStoreId[0].storeId + 1;
    Logger.info('<Route>:<StoreService>: <Store onboarding: creating new store>');
    storePayload.storeId = '' + storeId;
    const newStore = new Store(storePayload);
    newStore.save();
    Logger.info('<Service>:<StoreService>: <Store onboarding: created new store successfully>');
    return newStore;
  }
  async update(storeRequest: StoreRequest): Promise<IStore> {
    Logger.info('<Service>:<StoreService>:<Update store service initiated>');
    const {storePayload} = storeRequest;
    const { category, subCategory, brand } = storePayload.basicInfo;
    if(category &&  subCategory && brand){
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
    await Store.findOneAndUpdate({storeId:storePayload.storeId},storePayload);
    Logger.info('<Service>:<StoreService>: <Store: update store successfully>');
    const updatedStore = await Store.findOne({storeId:storePayload.storeId})
    return updatedStore;
  }
  async getById(storeId: string): Promise<IStore[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by Id service initiated>'
    );
    const stores = await Store.find({ storeId:storeId });
    return stores;
  }
  async getAll(): Promise<IStore[]> {
    Logger.info('<Service>:<StoreService>:<Get all stores service initiated>');
    const stores = await Store.find({});
    return stores;
  }
  async getByOwner(userId: string): Promise<IStore[]> {
    Logger.info(
      '<Service>:<StoreService>:<Get stores by owner service initiated>'
    );
    const objId = new Types.ObjectId(userId);
    const stores = await Store.find({userId:objId});
    return stores;
  }
}
