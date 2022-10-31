import { injectable } from 'inversify';
import bcrypt from 'bcryptjs';
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
    // const password = reqBody.password;
    // const salt = await bcrypt.genSalt(10);
    // const hashed = await bcrypt.hash(password, salt);
    upAdminFields.password = secureRandomPassword.randomPassword();
    // Build user object based on IAdmin

    const lastCreatedAdminId = await Admin.find({})
      .sort({ createdAt: 'desc' })
      .select('userId')
      .limit(1)
      .exec();

    const userId: number = !lastCreatedAdminId[0]
      ? new Date().getFullYear() * 100
      : +lastCreatedAdminId[0].userId + 1;

    upAdminFields.userId = String(userId);
    upAdminFields.userName = `OEM${String(userId).slice(-4)}`;
    upAdminFields.role = 'OEM';

    const newAdmin = await Admin.create(upAdminFields);

    Logger.info('<Controller>:<AdminService>:<Admin created successfully>');
    return newAdmin;
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
