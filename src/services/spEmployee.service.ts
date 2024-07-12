/* eslint-disable no-console */
import { injectable } from 'inversify';
import _ from 'lodash';
import bcrypt from 'bcryptjs';
import secureRandomPassword from 'secure-random-password';
import container from '../config/inversify.container';
import { Types } from 'mongoose';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import { S3Service } from './s3.service';
import EventModel, { IEvent, EventStatus } from './../models/Event';
import Store, { IStore } from './../models/Store';
import Customer, { ICustomer } from './../models/Customer';
import OfferModel, { IOffer } from './../models/Offers';
import InterestedEventAndOffer, {
  IInterestedEventAndOffer
} from './../models/InterestedEventsAndOffers';
import Admin, { AdminRole, IAdmin } from '../models/Admin';
import { sendEmail, sendNotification } from '../utils/common';
import SPEmployee, { ISPEmployee } from '../models/SPEmployee';
import { permissions } from '../config/permissions';
import { StaticIds } from '../models/StaticId';

@injectable()
export class SPEmployeeService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(employeePayload: ISPEmployee): Promise<any> {
    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee Creation: creating new employee>'
    );

    // check if store id exist
    const { employeeId, userName } = employeePayload;
    let employee: ISPEmployee;
    if (employeeId) {
      employee = await SPEmployee.findOne({ employeeId, userName });
    }
    if (employee) {
      return {
        message: `Error`,
        isPresent: true
      };
    }
    // const str = userName;
    // const numbers = str.match(/\d+/g).join('');
    // const lastCreatedJobId = await Admin.find({ storeId })
    //   .sort({ createdAt: 'desc' })
    //   .limit(1)
    //   .exec();

    // const jobCardNumber = !lastCreatedJobId[0]
    //   ? 1
    //   : Number(+lastCreatedJobId[0].jobCardNumber) + 1;

    const oemUserDetails: IAdmin = await Admin.findOne({
      userName: employeePayload.userName
    });

    if (!oemUserDetails) {
      throw new Error('Oem UserName does not exist');
    }

    const upAdminFields: any = {};
    const lastCreatedAdmin = await StaticIds.find({}).limit(1).exec();
    const employeeIdUser = String(parseInt(lastCreatedAdmin[0].employeeId) + 1);

    await StaticIds.findOneAndUpdate({}, { employeeId: employeeIdUser });

    const password = secureRandomPassword.randomPassword();

    upAdminFields.password = await this.encryptPassword(password);

    console.log(String(employeeIdUser).slice(-4), 'adflkw');

    // const employeePassword = await this.encryptPassword(employeePayload);

    upAdminFields.userId = String(employeeIdUser);
    upAdminFields.userName = `EMP${String(employeeIdUser).slice(-4)}`;
    upAdminFields.role = 'EMPLOYEE';
    upAdminFields.nameSalutation = employeePayload?.nameSalutation;
    upAdminFields.ownerName = employeePayload?.name;
    upAdminFields.businessName = oemUserDetails?.businessName;
    upAdminFields.isFirstTimeLoggedIn = true;
    upAdminFields.accessList = permissions.EMPLOYEE;
    upAdminFields.generatedPassword = password;
    upAdminFields.oemId = employeePayload.userName;
    upAdminFields.employeeId = employeePayload.employeeId;

    let newEmp: ISPEmployee = employeePayload;
    newEmp = await SPEmployee.create(newEmp);
    const newAdmin: IAdmin = await Admin.create(upAdminFields);
    const templateData = {
      name: employeePayload?.name,
      companyName: oemUserDetails?.businessName,
      email: oemUserDetails?.contactInfo?.email || '',
      userName: `EMP${String(employeeIdUser).slice(-4)}`,
      password: password
    };
    sendEmail(
      templateData,
      employeePayload?.email,
      'support@serviceplug.in',
      'EmployeeOnboarded'
    );
    Logger.info(
      '<Service>:<SPEmployeeService>:<Employee created successfully>'
    );
    return newEmp;
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  async updateEmployeeImage(employeeId: string, req: Request | any) {
    Logger.info('<Service>:<SPEmployeeService>:<Employee image uploading>');
    const employee: ISPEmployee = await SPEmployee.findOne({
      _id: new Types.ObjectId(employeeId)
    });
    if (_.isEmpty(employee)) {
      throw new Error('Employee does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = employee.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      employeeId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await SPEmployee.findOneAndUpdate(
      { _id: employeeId },
      { $set: { profileImageUrl } },
      { returnDocument: 'after' }
    );
    return res;
  }

  getAllEmployeesByUserName = async (
    userName: string
  ): Promise<ISPEmployee[]> => {
    Logger.info(
      '<Controller>:<SPEmployeeService>:<Get All employees request controller initiated>'
    );
    const employees: ISPEmployee[] = await SPEmployee.aggregate([{
      $match: { userName: userName}
    },
    {
      $lookup: {
        from: 'admin_users',
        localField: 'employeeId',
        foreignField: 'employeeId',
        as: 'employeeAuthDetails'
      }
    }]);
    Logger.info(
      '<Service>:<SPEmployeeService>:<Employee fetched successfully>'
    );
    return employees;
  };

  getEmployeeByEmployeeId = async (
    employeeId: string,
    userName: string
  ): Promise<ISPEmployee> => {
    Logger.info(
      '<Controller>:<SPEmployeeService>:<Get All employees request controller initiated>'
    );
    const employee: ISPEmployee = await SPEmployee.findOne({
      employeeId,
      userName
    })?.lean();
    Logger.info(
      '<Service>:<SPEmployeeService>:<Employee fetched successfully>'
    );
    return employee;
  };

  async update(employeePayload: any): Promise<ISPEmployee> {
    Logger.info('<Service>:<SPEmployeeService>:<Update employee initiated>');
    const { userName, employeeId } = employeePayload;

    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee: updating new employee>'
    );
    const query: any = {};
    query.userName = userName;
    query.employeeId = employeeId;
    const employee: ISPEmployee = await SPEmployee.findOne({
      userName,
      employeeId
    });
    const adminUser: IAdmin = await Admin.findOne({
      oemId: userName,
      employeeId
    });
    if (_.isEmpty(employee)) {
      throw new Error('Employee does not exist');
    }
    const updatedEmployee = await SPEmployee.findOneAndUpdate(
      query,
      employeePayload,
      {
        returnDocument: 'after'
      }
    );

    const updatedAdmin = await Admin.findOneAndUpdate(
      { oemId: userName, employeeId: employeeId },
      {
        $set: {
          nameSalutation: employeePayload?.nameSalutation,
          ownerName: employeePayload?.name
        }
      },
      {
        returnDocument: 'after'
      }
    );

    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee: update employee successfully>'
    );
    return updatedEmployee;
  }

  async deleteEmployee(employeeId: string, userName?: string): Promise<any> {
    Logger.info(
      '<Service>:<SPEmployeeService>:<Delete employee by Id service initiated>'
    );
    const query: any = {};
    query.employeeId = employeeId;
    query.userName = userName;
    console.log(query, 'dlfme');
    const res = await SPEmployee.findOneAndDelete(query);
    const adminDelete = await Admin.findOneAndDelete({ employeeId: employeeId, oemId: userName})
    return res;
  }

  async resetPassword(employeeId: string, oemId?: string): Promise<any> {
    Logger.info(
      '<Service>:<SPEmployeeService>:<Delete employee by Id service initiated>'
    );
    const query: any = {};
    query.employeeId = employeeId;
    query.oemId = oemId;
    
    let employee: ISPEmployee;
    if (employeeId) {
      employee = await SPEmployee.findOne({ employeeId, userName: oemId });
    }
    const oemUserDetails: IAdmin = await Admin.findOne({
      oemId,
      employeeId
    });
    
    const password = secureRandomPassword.randomPassword();
    const updatedPassword = await this.encryptPassword(password);
    const res = await Admin.findOneAndUpdate(
      { employeeId: employeeId, oemId: oemId },
      { $set: { password: updatedPassword, generatedPassword: password, isFirstTimeLoggedIn: true } },
      { returnDocument: 'after' }
    );
    const templateData = {
      name: employee?.name,
      userName: oemUserDetails?.userName,
      password: password
    };
    sendEmail(
      templateData,
      employee?.email,
      'support@serviceplug.in',
      'EmployeeResetPassword'
    );
    return "res";
  }
}
