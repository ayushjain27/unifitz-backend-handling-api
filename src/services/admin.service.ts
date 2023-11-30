import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import secureRandomPassword from 'secure-random-password';
import { TYPES } from '../config/inversify.types';
import Payload from '../types/payload';
import container from '../config/inversify.container';
import Admin, { IAdmin } from '../models/Admin';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import { generateToken } from '../utils';
import { IDocumentImageList } from '../models/Admin';
import { Types } from 'mongoose';

@injectable()
export class AdminService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(reqBody: IAdmin): Promise<IAdmin> {
    const upAdminFields = Object.assign({}, reqBody) as IAdmin;

    // Update the password
    const password = secureRandomPassword.randomPassword();

    upAdminFields.password = await this.encryptPassword(password);
    // Build user object based on IAdmin

    // User the unique user ID
    const lastCreatedAdmin = await Admin.find({})
      .sort({ createdAt: 'desc' })
      .limit(1)
      .exec();

    const userId: number =
      !lastCreatedAdmin[0] || !lastCreatedAdmin[0]?.userId
        ? new Date().getFullYear() * 100
        : +lastCreatedAdmin[0].userId + 1;

    upAdminFields.userId = String(userId);
    upAdminFields.userName = `SP${String(userId).slice(-4)}`;
    upAdminFields.role = 'OEM';
    upAdminFields.isFirstTimeLoggedIn = true;

    const newAdmin: IAdmin = (
      await Admin.create(upAdminFields)
    ).toObject<IAdmin>();
    newAdmin.generatedPassword = password;

    Logger.info('<Service>:<AdminService>:<Admin created successfully>');
    return newAdmin;
  }

  async uploadDocuments(userId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Upload Document Images initiated>');

    const document: IAdmin = await Admin.findOne({
      _id: new Types.ObjectId(userId)
    });
    if (_.isEmpty(document)) {
      throw new Error('User does not exist');
    }
    Logger.debug(`${document} document`);
    const files: Array<any> = req.files;

    const documentImageList: Partial<IDocumentImageList> | any =
      document.documentImageList || {
        panFrontView: {},
        panBackView: {},
        aadhaarFrontView: {},
        aadhaarBackView: {}
      };

    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName:
        | 'panFrontView'
        | 'panBackView'
        | 'aadhaarFrontView'
        | 'aadhaarBackView' = file.originalname?.split('.')[0];
      const { key, url } = await this.s3Client.uploadFile(
        userId,
        fileName,
        file.buffer
      );
      documentImageList[fileName] = { key, docURL: url };
    }

    Logger.info(`<Service>:<AdminService>:<Upload all images - successful>`);

    const res = await Admin.findOneAndUpdate(
      { _id: userId },
      { $set: { documentImageList } },
      {
        returnDocument: 'after',
        projection: { 'verificationDetails.verifyObj': 0 }
      }
    );
    return res;
  }

  async updateUser(reqBody: IAdmin, userName: string): Promise<any> {
    const user = await this.getAdminUserByUserName(userName);
    if (!user) {
      Logger.error('<Service>:<AdminService>:<Admin User not found>');
      throw new Error('Admin user not found');
    }
    // const updatedUser = { ...user, reqBody };
    const query: any = {};
    query.userName = reqBody.userName;
    Logger.debug(`${query.userName}, ${query},${reqBody.userName}, ${reqBody}`);
    const res = await Admin.findOneAndUpdate(query, reqBody, {
      returnDocument: 'after',
      projection: { 'verificationDetails.verifyObj': 0 }
    });
    return res;
  }

  async uploadAdminImage(userId: string, req: Request | any): Promise<any> {
    Logger.info('<Service>:<AdminService>:<Into the upload photo >');
    const file = req.file;
    if (!file) {
      throw new Error('File does not exist');
    }

    const admin: IAdmin = await Admin.findOne({ userName: userId })?.lean();

    if (_.isEmpty(admin)) {
      throw new Error('User does not exist');
    }
    const { key, url } = await this.s3Client.uploadFile(
      userId,
      'profile',
      file.buffer
    );
    const companyLogo = { key, url };
    const res = await Admin.findOneAndUpdate(
      { userName: userId },
      { $set: { companyLogo } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async login(
    userName: string,
    password: string
  ): Promise<{ user: IAdmin; token: string }> {
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();

    if (admin) {
      Logger.info('<Service>:<AdminService>:<Admin present in DB>');
      if (!(await bcrypt.compare(password, admin.password))) {
        throw new Error('Password validation failed');
      }
      Logger.info(
        '<Service>:<AdminService>:<Admin password validated successfully>'
      );
      if (admin.isFirstTimeLoggedIn) {
        await Admin.findOneAndUpdate(
          { _id: admin._id },
          { $set: { isFirstTimeLoggedIn: false } }
        );
      }
    }
    const payload: Payload = {
      userId: admin.userName,
      role: admin.role
    };
    const token = await generateToken(payload);
    delete admin.password;

    return { user: admin, token };
  }

  async getAll(): Promise<IAdmin[]> {
    const admin: IAdmin[] = await Admin.find({}, { password: 0 }).lean();

    return admin;
  }

  async getAdminUserByUserName(userName: string): Promise<IAdmin> {
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();

    if (_.isEmpty(admin)) {
      throw new Error('User does not exist');
    }
    delete admin.password;
    return admin;
  }

  async updatePassword(userName: string, password: string): Promise<any> {
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();
    if (_.isEmpty(admin)) {
      throw new Error('User does not exist');
    }
    const updatedPassword = await this.encryptPassword(password);
    await Admin.findOneAndUpdate(
      { _id: admin._id },
      { $set: { password: updatedPassword } }
    );
    return true;
  }

  async updateUserStatus(reqBody: {
    userName: string;
    status: string;
  }): Promise<any> {
    Logger.info('<Service>:<UserService>:<Update user status >');

    const admin: IAdmin = await Admin.findOneAndUpdate(
      {
        userName: reqBody?.userName
      },
      { $set: { status: reqBody.status } },
      { returnDocument: 'after' }
    );

    return admin;
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }
}
