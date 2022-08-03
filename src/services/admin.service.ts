import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
import Payload from '../types/payload';
import Admin, { IAdmin } from '../models/Admin';
import Logger from '../config/winston';
import { generateToken } from '../utils';

@injectable()
export class AdminService {
  async create(userName: string, password: string): Promise<string> {
    let admin: IAdmin = await Admin.findOne({ userName });

    if (admin) {
      throw new Error('Admin already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Build user object based on IAdmin
    const adminFields = {
      userName,
      password: hashed
    };

    admin = new Admin(adminFields);

    await admin.save();
    Logger.info('<Controller>:<AdminService>:<Admin created successfully>');
    return userName;
  }

  async login(userName: string, password: string): Promise<string> {
    const admin: IAdmin = await Admin.findOne({ userName });

    if (admin) {
      Logger.info('<Controller>:<AdminService>:<Admin present in DB>');
      if (!(await bcrypt.compare(password, admin.password))) {
        throw new Error('Password validation failed');
      }
      Logger.info(
        '<Controller>:<AdminService>:<Admin password validated successfully>'
      );
    }
    const payload: Payload = {
      userId: admin.userName,
      role: admin.role
    };
    return await generateToken(payload);
  }
}
