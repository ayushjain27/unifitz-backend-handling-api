import { injectable } from 'inversify';
import HttpStatusCodes from 'http-status-codes';

import Logger from '../config/winston';
import Catalog, { ICatalog } from '../models/Catalog';
import Store, { IStore } from '../models/Store';
import User, { IUser } from '../models/User';

@injectable()
export class StoreService {

  async create(storeDetails:IStore) {
    Logger.info('<Service>:<StoreService>:<Onboarding service initiated>');
      const ownerDetails: IUser = await User.findOne({
        phoneNumber: storeDetails.phoneNumber
      });
      delete storeDetails.phoneNumber;
      storeDetails.userId = ownerDetails._id;
      const { category, subCategory, brand } = storeDetails.basicInfo;
      let getCategory: ICatalog = await Catalog.findOne({ catalogName: category.name, parent: 'root' });
      let getSubCategory: ICatalog = await Catalog.findOne({ tree: `root/${category.name}`, catalogName: subCategory.name });
      let getBrand: ICatalog = await Catalog.findOne({
        tree: `root/${category.name}/${subCategory.name}`,
        catalogName: brand.name
      });
      try{
        storeDetails.basicInfo.category._id = getCategory._id;
        storeDetails.basicInfo.subCategory._id = getSubCategory._id;
        storeDetails.basicInfo.brand._id = getBrand._id;
      }
      catch(err){
        Logger.error(`Wrong Catalog Details`);
      }
      const lastCreatedStoreId = await Store.find({}).sort({ createdAt: 'desc'}).select('storeId').limit(1).exec();
      const storeId = +lastCreatedStoreId[0].storeId+1;
      Logger.info('<Route>:<Store>: <Store onboarding: creating new store>');
      storeDetails.storeId = ''+storeId;
      const newStore = new Store(storeDetails);
      newStore.save();
      return newStore;
  }
}
