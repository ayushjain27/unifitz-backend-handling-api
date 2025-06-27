import { injectable } from 'inversify';
import { Types } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { isEmpty } from 'lodash';
import Logger from '../config/winston';
import container from '../config/inversify.container';
import { S3Service } from './s3.service';
import { TYPES } from '../config/inversify.types';
import DeleteAccount, { IDeleteAccount } from '../models/DeleteAccount';
import { AccountDeleteRequest } from '../interfaces/accountDeleteRequest.interface';
import { UserService } from './user.service';
import { StoreService } from './store.service';
import { CustomerService } from './customer.service';
import StudioInfo from '../models/StudioInfo';
import HeroContent from '../models/HeroContent';
import AboutContent from '../models/AboutContent';
import Classes from '../models/Classes';

@injectable()
export class DeleteAccountService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private userService = container.get<UserService>(TYPES.UserService);
  private storeService = container.get<StoreService>(TYPES.StoreService);
  private customerService = container.get<CustomerService>(
    TYPES.CustomerService
  );
  
  constructor() {
    // Initialize Cloudinary configuration
    cloudinary.config({ 
      cloud_name: 'du028g1cr', 
      api_key: '677771287652153', 
      api_secret: 'yunkSLXGEhDrn2W-kYc-s26qWVI' // Use environment variable
    });
  }

  async uploadImage(imagePath: string, options: any = {}): Promise<any> {
    try {
      const uploadResult = await cloudinary.uploader.upload(imagePath, {
        public_id: options.public_id || `img_${Date.now()}`,
        ...options
      });
      return uploadResult;
    } catch (error) {
      Logger.error('Cloudinary upload failed:', error);
      throw new Error('Image upload failed');
    }
  }

  async createStudioIndo(studioInfoRequest: any): Promise<any> {
    let studioInfoPayload = studioInfoRequest;
    studioInfoPayload.contact.phoneNumber = `+91${studioInfoRequest?.contact?.phoneNumber?.slice(-10)}`;
    let newStudioInfo;
    try {
      newStudioInfo = await StudioInfo.create(studioInfoPayload);
    } catch (err) {
      throw new Error(err);
    }
    return newStudioInfo;
  };

  async createHeroContent(heroContentRequest: any): Promise<any> {
    let heroContentPayload = heroContentRequest;
    Logger.info(
      '<Route>:<StoreService>: <Studio Info onboarding: creating new studio info>'
    );
    let newHeroContentInfo;
    try {
      newHeroContentInfo = await HeroContent.create(heroContentPayload);
    } catch (err) {
      throw new Error(err);
    }
    Logger.info(
      '<Service>:<StoreService>: <StudioInfo onboarding: created new studioinfo successfully>'
    );
    return newHeroContentInfo;
  }

  async aboutContent(aboutContentRequest: any): Promise<any> {
    let aboutContentPayload = aboutContentRequest;
    let aboutContentInfo;
    try {
      aboutContentInfo = await AboutContent.create(aboutContentPayload);
    } catch (err) {
      throw new Error(err);
    }
    return aboutContentInfo;
  }

  async benefits(benefitsRequest: any): Promise<any> {
    let benefitsPayload = benefitsRequest;
    let benefits;
    try {
      benefits = await HeroContent.create(benefitsPayload);
    } catch (err) {
      throw new Error(err);
    }
    return benefits;
  }

  async classes(classesRequest: any): Promise<any> {
    let classesPayload = classesRequest;
    let classes;
    try {
      classes = await Classes.create(classesPayload);
    } catch (err) {
      throw new Error(err);
    }
    return classes;
  }
}
