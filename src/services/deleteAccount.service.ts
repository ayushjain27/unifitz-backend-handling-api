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
import { StaticIds } from '../models/StaticId';
import bcrypt from 'bcryptjs';
import SignUp from '../models/SignUp';
import { generateToken } from '../utils';
import Benefits from '../models/Benefits';
import Instructors from '../models/Instructors';
import PricingPlans from '../models/PricingPlans';
import Testimonials from '../models/Testimonials copy 3';

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

  async uploadImage(imagePath: string, type: string, id: string): Promise<any> {
    try {
      const uploadResult = await cloudinary.uploader.upload(imagePath, {
        public_id: `img_${Date.now()}`
      });
      if (type === 'Classes') {
        const result = Classes.findOneAndUpdate(
          {
            _id: new Types.ObjectId(id)
          },
          {
            $set: { image: uploadResult?.secure_url }
          },
          {
            new: true
          }
        );
      }else if (type === 'instructors') {
        const result = Instructors.findOneAndUpdate(
          {
            _id: new Types.ObjectId(id)
          },
          {
            $set: { image: uploadResult?.secure_url }
          },
          {
            new: true
          }
        );
      }else if (type === 'testimonials') {
        const result = Testimonials.findOneAndUpdate(
          {
            _id: new Types.ObjectId(id)
          },
          {
            $set: { image: uploadResult?.secure_url }
          },
          {
            new: true
          }
        );
      }
      return uploadResult;
    } catch (error) {
      Logger.error('Cloudinary upload failed:', error);
      throw new Error('Image upload failed');
    }
  }

  async signup(profileRequest: any): Promise<any> {
    let profilePayload = profileRequest;
    let checkEmail = await SignUp.findOne({
      email: profilePayload?.email
    });
    if (!isEmpty(checkEmail)) {
      throw new Error('Email already exists');
    }
    const lastCreatedInstructorId = await StaticIds.find({}).limit(1).exec();

    const newInstructorId = String(
      parseInt(lastCreatedInstructorId[0].instructorId) + 1
    );

    await StaticIds.findOneAndUpdate({}, { instructorId: newInstructorId });
    const updatedPassword = await this.encryptPassword(profilePayload.password);
    profilePayload.password = updatedPassword;
    profilePayload.role = 'INSTRUCTOR';
    profilePayload.userName = `#INS${newInstructorId}`;
    let newSignUp;
    try {
      newSignUp = await SignUp.create(profilePayload);
    } catch (err) {
      throw new Error(err);
    }
    return newSignUp;
  }

  async login(profileRequest: any): Promise<any> {
    let profilePayload = profileRequest;
    const { email } = profilePayload;
    const loginDetails = await SignUp.findOne({
      email
    });
    if (isEmpty(loginDetails)) {
      throw new Error('User not Found');
    }
    if (
      !(await bcrypt.compare(profilePayload.password, loginDetails.password))
    ) {
      throw new Error('Password validation failed');
    }
    const payload = {
      userId: loginDetails,
      role: profilePayload?.role
    };
    try {
      const token = await generateToken(payload);
      return { user: loginDetails, token };
    } catch (err) {
      throw new Error(err);
    }
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
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
  }

  async getAllStudioInfo(userName: any): Promise<any> {
    try {
      const result = StudioInfo.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

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

  async getAllHeroContent(userName: any): Promise<any> {
    try {
      const result = HeroContent.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
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

  async getAllAboutContent(userName: any): Promise<any> {
    try {
      const result = AboutContent.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async benefits(benefitsRequest: any): Promise<any> {
    let benefitsPayload = benefitsRequest;
    let benefits;
    try {
      benefits = await Benefits.create(benefitsPayload);
    } catch (err) {
      throw new Error(err);
    }
    return benefits;
  }

  async getAllBenefits(userName: any): Promise<any> {
    try {
      const result = Benefits.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
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

  async getAllClasses(userName: any): Promise<any> {
    try {
      const result = Classes.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async instructors(instructorRequest: any): Promise<any> {
    let instructorPayload = instructorRequest;
    let instructors;
    try {
      instructors = await Instructors.create(instructorPayload);
    } catch (err) {
      throw new Error(err);
    }
    return instructorPayload;
  }

  async getAllInstructors(userName: any): Promise<any> {
    try {
      const result = Instructors.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async pricingPlans(pricingPlansRequest: any): Promise<any> {
    let pricingPlansPayload = pricingPlansRequest;
    let pricingPlans;
    try {
      pricingPlans = await PricingPlans.create(pricingPlansPayload);
    } catch (err) {
      throw new Error(err);
    }
    return pricingPlans;
  }

  async getAllPricingPlans(userName: any): Promise<any> {
    try {
      const result = PricingPlans.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }

  async testimonials(testimonialsRequest: any): Promise<any> {
    let testimonialsPayload = testimonialsRequest;
    let testimonials;
    try {
      testimonials = await Testimonials.create(testimonialsPayload);
    } catch (err) {
      throw new Error(err);
    }
    return testimonials;
  }

  async getAllTestimonials(userName: any): Promise<any> {
    try {
      const result = Testimonials.find({ userName });
      return result;
    } catch (err) {
      throw new Error(err);
    }
  }
}
