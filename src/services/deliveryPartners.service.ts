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
import Admin, { IAdmin } from '../models/Admin';
import SPEmployee, { ISPEmployee } from '../models/SPEmployee';
import { permissions } from '../config/permissions';
import { StaticIds } from '../models/StaticId';
import { SQSEvent } from '../enum/sqsEvent.enum';
import { SQSService } from './sqs.service';
import DeliveryPartners, {
  IDeliveryPartners
} from '../models/DeliveryPartners';

@injectable()
export class DeliveryPartnerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private sqsService = container.get<SQSService>(TYPES.SQSService);

  async create(deliveryPatnerPayload: IDeliveryPartners): Promise<any> {
    Logger.info(
      '<Service>:<DeliveryPartnerService>: <Delivery Partner Creation: creating new delivery partner>'
    );

    // check if store id exist
    const { userName } = deliveryPatnerPayload;

    try {
      // Find the latest delivery partner with the same userName
      const latestPartner = await DeliveryPartners.findOne({
        userName
      }).sort({ createdAt: -1 });

      if (latestPartner && latestPartner.partnerId) {
        const prefix = latestPartner.partnerId.substring(0, 6); // Get "SP2245"
        const numericPart = latestPartner.partnerId.substring(6); // Get "01"

        // Increment the numeric part and pad with leading zeros
        const incrementedNumber = String(
          parseInt(numericPart, 10) + 1
        ).padStart(numericPart.length, '0');
        const newPartnerId = prefix + incrementedNumber;

        deliveryPatnerPayload.partnerId = newPartnerId;
      }else{
        deliveryPatnerPayload.partnerId = `${deliveryPatnerPayload?.userName}00`;
      }

      const newDeliveryPartner = await DeliveryPartners.create(
        deliveryPatnerPayload
      );

      Logger.info(
        '<Service>:<DeliveryPartnerService>:<Delivery Partner created successfully>'
      );
      return newDeliveryPartner;
    } catch (error) {
      Logger.error(
        `<Service>:<DeliveryPartnerService>: <Error in create>: ${error.message}`
      );
      throw error;
    }
  }

  private async encryptPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  }

  async uploadDeliveryPartnerImage(deliveryPartnerId: string, req: Request | any) {
    Logger.info('<Service>:<DeliveryPartnerService>:<Delivery Partner image uploading>');
    const deliveryPartner: IDeliveryPartners = await DeliveryPartners.findOne({
      _id: new Types.ObjectId(deliveryPartnerId)
    });
    if (_.isEmpty(deliveryPartner)) {
      throw new Error('Delivery Partner does not exist');
    }
    const file: any = req.file;

    let profileImageUrl: any = deliveryPartner.profileImageUrl || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      deliveryPartnerId,
      fileName,
      file.buffer
    );
    profileImageUrl = url;

    const res = await DeliveryPartners.findOneAndUpdate(
      { _id: new Types.ObjectId(deliveryPartnerId) },
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
    const employees: ISPEmployee[] = await SPEmployee.aggregate([
      {
        $match: { userName: userName }
      },
      {
        $lookup: {
          from: 'admin_users',
          localField: 'employeeId',
          foreignField: 'employeeId',
          as: 'employeeAuthDetails'
        }
      }
    ]);
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
    });
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
    const adminDelete = await Admin.findOneAndDelete({
      employeeId: employeeId,
      oemId: userName
    });
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

    // const password = secureRandomPassword.randomPassword();
    const password = secureRandomPassword.randomPassword({
      characters: [
        { characters: secureRandomPassword.upper, exactly: 3 },
        { characters: secureRandomPassword.symbols, exactly: 3 },
        { characters: secureRandomPassword.lower, exactly: 4 },
        { characters: secureRandomPassword.digits, exactly: 2 }
      ]
    });
    const updatedPassword = await this.encryptPassword(password);
    const res = await Admin.findOneAndUpdate(
      { employeeId: employeeId, oemId: oemId },
      {
        $set: {
          password: updatedPassword,
          generatedPassword: password,
          isFirstTimeLoggedIn: true
        }
      },
      { returnDocument: 'after' }
    );
    const templateData = {
      name: employee?.name,
      userName: oemUserDetails?.userName,
      password: password
    };
    const data = {
      to: employee?.email,
      templateData: templateData,
      templateName: 'EmployeeResetPassword'
    };
    const sqsMessage = await this.sqsService.createMessage(
      SQSEvent.EMAIL_NOTIFICATION,
      data
    );
    console.log(sqsMessage, 'Message');
    // sendEmail(
    //   templateData,
    //   employee?.email,
    //   'support@serviceplug.in',
    //   'EmployeeResetPassword'
    // );
    return 'res';
  }

  async updatePermission(employeePayload: any): Promise<ISPEmployee> {
    Logger.info('<Service>:<SPEmployeeService>:<Update employee initiated>');
    const { userName, employeeId, permission } = employeePayload;

    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee: updating new employee>'
    );
    const query: any = {};
    query.userName = userName;
    query.employeeId = employeeId;

    let permissionList: any = {};
    if (permission === 'STORE_LEAD_GENERATION') {
      permissionList = {
        $set: {
          'accessPolicy.STORE_LEAD_GENERATION': {
            APPROVE: 'ENABLED'
          }
        }
      };
    }
    if (permission === 'VIDEOUPLOAD') {
      permissionList = {
        $set: {
          'accessList.VIDEOUPLOAD': {
            STATUS: 'ALL',
            CREATE: true,
            READ: true,
            UPDATE: true,
            DELETE: true
          }
        }
      };
    }

    const updatedAdmin: any = await Admin.findOneAndUpdate(
      { oemId: userName, employeeId: employeeId },
      permissionList,
      {
        returnDocument: 'after'
      }
    );

    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee: update employee successfully>'
    );
    return updatedAdmin;
  }

  async updateUserPermission(employeePayload: any): Promise<ISPEmployee> {
    Logger.info('<Service>:<SPEmployeeService>:<Update employee initiated>');
    const { userName, role } = employeePayload;

    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee: updating new employee>'
    );
    const query: any = {
      role,
      companyType: userName
    };

    let permissionList: any = {};
    permissionList = {
      $set: {
        'accessList.B2B_DISTRIBUTORS': {
          STATUS: 'OEM & EMPLOYEE',
          CREATE: false,
          READ: false,
          UPDATE: false,
          DELETE: false
        }
      }
    };

    const updatedAdmin: any = await Admin.updateMany(query, permissionList);

    Logger.info(
      '<Service>:<SPEmployeeService>: <Employee: update employee successfully>'
    );
    return updatedAdmin;
  }
}
