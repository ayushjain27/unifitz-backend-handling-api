import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import SPEmployee from '../models/SPEmployee';
import User from '../models/User';
import { S3Service } from './s3.service';
import { Employee, IEmployee } from '../models/Employee';
import { TwilioLoginPayload, TwilioVerifyPayload } from '../interfaces';
import { defaultCodeLength } from '../config/constants';
import { generateToken } from '../utils';
import { testUsers } from '../config/constants';
import { TwoFactorService } from './twoFactor.service';
import { Types } from 'mongoose';
import _ from 'lodash';

@injectable()
export class EmployeeService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);
  private twoFactorService = container.get<TwoFactorService>(
    TYPES.TwoFactorService
  );

  async create(employeePayload: IEmployee): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Creation: creating new employee>'
    );

    // check if store id exist
    const { storeId } = employeePayload;
    let store: IStore;
    if (storeId) {
      store = await Store.findOne({ storeId }, { verificationDetails: 0 });
    }
    if (!store) {
      Logger.error('<Service>:<EmployeeService>:< Store id not found>');
      throw new Error('Store not found');
    }
    let newEmp: IEmployee = employeePayload;
    newEmp.storeId = store?.storeId;
    newEmp = await Employee.create(newEmp);
    Logger.info('<Service>:<EmployeeService>:<Employee created successfully>');
    return newEmp;
  }

  async updateEmployeeImage(employeeId: string, req: Request | any) {
    Logger.info('<Service>:<CustomerService>:<Customer image uploading>');
    const employee: IEmployee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId)
    })?.lean();
    if (_.isEmpty(employee)) {
      throw new Error('employee does not exist');
    }
    const file: any = req.file;

    let profilePhoto: any = employee.profilePhoto || '';

    if (!file) {
      throw new Error('Files not found');
    }

    const fileName = 'profile';
    const { url } = await this.s3Client.uploadFile(
      employeeId,
      fileName,
      file.buffer
    );
    profilePhoto = url;

    const res = await Employee.findOneAndUpdate(
      { _id: employeeId },
      { $set: { profilePhoto } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async getEmployeesByStoreId(storeId: string): Promise<IEmployee[]> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Fetch: getting all the employees by store id>'
    );

    const employees: IEmployee[] = await Employee.find({ storeId }).lean();
    Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
    return employees;
  }

  async update(
    employeeId: string,
    employeePayload: IEmployee
  ): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee onboarding: creating new employee>'
    );
    await Employee.findOneAndUpdate(
      {
        _id: new Types.ObjectId(employeeId)
      },
      employeePayload
    );
    const updatedEmployeePayload = Employee.findById(
      new Types.ObjectId(employeeId)
    );
    Logger.info('<Service>:<EmployeeService>:<Employee updated successfully>');
    return updatedEmployeePayload;
  }

  async getEmployeesByEmployeeId(
    storeId: string,
    employeeId: string
  ): Promise<IEmployee> {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee Fetch: getting all the employees by store id>'
    );
    let employee: IEmployee = await Employee.findOne({ storeId }).lean();
    if (_.isEmpty(employee)) {
      throw new Error('Store Id not exists');
    }
    employee = await Employee.findOne({
      _id: new Types.ObjectId(employeeId)
    }).lean();
    Logger.info('<Service>:<EmployeeService>:<Employee fetched successfully>');
    return employee;
  }

  async sendOtpWithEmployee(employeePayload: any) {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee OTP: creating new Otp>'
    );

    // check if employee exist
    const { phoneNumber, channel } = employeePayload;
    const loginPayload: TwilioLoginPayload = {
      phoneNumber,
      channel
    };
    let employee: any;
    if (phoneNumber) {
      employee = await SPEmployee.findOne(
        { 'phoneNumber.primary': phoneNumber?.slice(-10) },
        { verificationDetails: 0 }
      );
    }
    if (!employee) {
      throw new Error('Employee not found');
    }

    const result = await this.twoFactorService.sendVerificationCode(
      loginPayload.phoneNumber
    );
    const otpResult = {
      phoneNumber: loginPayload.phoneNumber,
      result
    };
    return otpResult;
  }

  async verifyEmployeeOtp(employeePayload: any) {
    Logger.info(
      '<Service>:<EmployeeService>: <Employee OTP Verify: verify employee>'
    );

    const { phoneNumber, code, role, deviceId } = employeePayload;
    const verifyPayload: TwilioVerifyPayload = {
      phoneNumber,
      code
    };

    if (
      verifyPayload.phoneNumber &&
      verifyPayload.code.length === defaultCodeLength
    ) {
      const { phoneNumber } = verifyPayload;

      // Check if the phone number starts with 3, 4, or 5 and the OTP is 6543
      const startsWith = ['3', '4', '5'];
      const isMatchingCondition =
        startsWith.includes(phoneNumber.charAt(3)) && code === '6543';

      if (isMatchingCondition) {
        // Phone number starts with 3, 4, or 5, and OTP is 6543, proceed with login
        const payload = {
          userId: phoneNumber,
          role: role
        };

        const token = await generateToken(payload);
        const jsonResult = {
          message: 'Login Successful',
          token,
          phoneNumber
        };
        return jsonResult;
      }

      // Check for test users
      const testUser = _.find(
        testUsers,
        (user) => `+91${user?.phoneNo}` === phoneNumber
      );
      if (testUser) {
        const isMatch = testUser?.otp === verifyPayload.code;
        if (!isMatch) {
          const jsonResult = {
            message: 'Invalid verification code :(',
            phoneNumber
          };
          return jsonResult;
        }
      } else {
        // Call the two-factor service if not a test user
        const result = await this.twoFactorService.verifyCode(
          phoneNumber,
          verifyPayload.code
        );
        if (!result || result?.Status === 'Error') {
          const jsonResult = {
            message: 'Invalid verification code :(',
            phoneNumber
          };
          return jsonResult;
        }
      }

      const payload = {
        userId: phoneNumber,
        role: role
      };

      const token = await generateToken(payload);
      const jsonRes = {
        message: 'Login Successful',
        token,
        phoneNumber
      };
      return jsonRes;
    } else {
      const jsonRes = {
        message: 'Invalid phone number or verification code :(',
        phoneNumber
      };
      return jsonRes;
    }
  }
}
