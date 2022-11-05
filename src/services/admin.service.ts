import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import secureRandomPassword from 'secure-random-password';
import Payload from '../types/payload';
import Admin, { IAdmin } from '../models/Admin';
import Logger from '../config/winston';
import { generateToken } from '../utils';

@injectable()
export class AdminService {
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

    Logger.info('<Controller>:<AdminService>:<Admin created successfully>');
    return newAdmin;
  }

  async login(
    userName: string,
    password: string
  ): Promise<{ user: IAdmin; token: string }> {
    const admin: IAdmin = await Admin.findOne({ userName })?.lean();

    if (admin) {
      Logger.info('<Controller>:<AdminService>:<Admin present in DB>');
      if (!(await bcrypt.compare(password, admin.password))) {
        throw new Error('Password validation failed');
      }
      Logger.info(
        '<Controller>:<AdminService>:<Admin password validated successfully>'
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

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }
}
