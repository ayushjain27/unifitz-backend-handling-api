/* eslint-disable no-console */
import { injectable } from 'inversify';
import container from '../config/inversify.container';
import { TYPES } from '../config/inversify.types';
import Logger from '../config/winston';
import Store, { IStore } from '../models/Store';
import { S3Service } from './s3.service';
import { Employee, IEmployee } from '../models/Employee';
import { Types } from 'mongoose';
import _, { update } from 'lodash';
import StoreCustomer, {
  IStoreCustomer,
  IStoreCustomerVehicleInfo,
  IVehicleImageList
} from '../models/StoreCustomer';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class StoreCustomerService {
  private s3Client = container.get<S3Service>(TYPES.S3Service);

  async create(storeCustomerPayload: IStoreCustomer): Promise<IStoreCustomer> {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Store Customer Creation: creating/updating store customer>'
    );
    try {
      const { phoneNumber, storeId } = storeCustomerPayload;

      // Search for an existing document based on phoneNumber and storeId
      const existingCustomer = await StoreCustomer.findOne({
        phoneNumber: phoneNumber,
        storeId: storeId
      });

      if (existingCustomer) {
        // Update the existing document
        const updatedCustomer = await StoreCustomer.findOneAndUpdate(
          { phoneNumber: phoneNumber, storeId: storeId },
          storeCustomerPayload,
          { new: true }
        );

        Logger.info(
          '<Service>:<StoreCustomerService>:<Store Customer updated successfully>'
        );
        return updatedCustomer;
      } else {
        // Create a new document
        const newCustomer = await StoreCustomer.create(storeCustomerPayload);
        Logger.info(
          '<Service>:<StoreCustomerService>:<New Store Customer created successfully>'
        );
        return newCustomer;
      }
    } catch (err) {
      Logger.error(err.message);
      throw err; // Rethrow the error to propagate it to the caller
    }
  }

  async getStoreCustomerByStoreId(storeId: string): Promise<IStoreCustomer[]> {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Store Customer Fetch: getting all the store customers by store id>'
    );

    const storeCustomers: IStoreCustomer[] = await StoreCustomer.find({
      storeId
    });
    Logger.info(
      '<Service>:<StoreCustomerService>:<Store Customer fetched successfully>'
    );
    return storeCustomers;
  }

  async getStoreCustomerByPhoneNumber(
    phoneNumber: string,
    storeId: string
  ): Promise<IStoreCustomer> {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Store Customer Fetch: getting all the store customers by store id>'
    );

    const storeCustomers: IStoreCustomer = await StoreCustomer.findOne({
      phoneNumber,
      storeId: storeId
    });
    Logger.info(
      '<Service>:<StoreCustomerService>:<Store Customer fetched successfully>'
    );
    return storeCustomers;
  }

  async createStoreCustomerVehicle(
    customerId: string,
    storeCustomerVehiclePayload: IStoreCustomerVehicleInfo
  ) {
    Logger.info(
      '<Service>:<StoreCustomerService>: <Vehicle Creation: creating new store customer vehicle>'
    );
    const storeCustomer: IStoreCustomer = await StoreCustomer.findOne({
      _id: new Types.ObjectId(customerId)
    });
    if (_.isEmpty(storeCustomer)) {
      throw new Error('Customer does not exist');
    }

    const { vehicleNumber } = storeCustomerVehiclePayload;

    let vehicleIndex = -1;
    if (storeCustomer) {
      // Find the index of the vehicle with the provided storeCustomerVehicleId
      vehicleIndex = storeCustomer.storeCustomerVehicleInfo.findIndex(
        (vehicle) => vehicle.vehicleNumber === vehicleNumber
      );
    }

    // Check if storeCustomerVehicleId exists
    if (vehicleIndex >= 0) {
      const res = await StoreCustomer.findOneAndUpdate(
        {
          _id: customerId // Ensure the vehicle ID also matches
        },
        {
          $set: {
            [`storeCustomerVehicleInfo.${vehicleIndex}`]:
              storeCustomerVehiclePayload
          }
        }, // Use the update object constructed dynamically
        { returnDocument: 'after' }
      );

      Logger.info(
        '<Service>:<StoreCustomerService>:<Customer updated successfully>'
      );

      return res;
    } else {
      // Push new vehicle info
      const res = await StoreCustomer.findOneAndUpdate(
        { _id: customerId },
        { $push: { storeCustomerVehicleInfo: storeCustomerVehiclePayload } },
        { returnDocument: 'after' }
      );
      Logger.info(
        '<Service>:<StoreCustomerService>:<New vehicle added successfully>'
      );
      return res;
    }
  }

  async uploadStoreCustomerVehicleImages(req: Request | any): Promise<any> {
    Logger.info(
      '<Service>:<StoreCustomerService>:<Upload Store Customer Vehicle Images initiated>'
    );

    const storeCustomer: IStoreCustomer = await StoreCustomer.findOne({
      _id: new Types.ObjectId(req.body.customerId)
    });
    if (_.isEmpty(storeCustomer)) {
      throw new Error('Customer does not exist');
    }
    const { vehicleNumber } = req.body;
    let vehicleIndex = -1;
    if (storeCustomer) {
      // Find the index of the vehicle with the provided storeCustomerVehicleId
      vehicleIndex = storeCustomer.storeCustomerVehicleInfo.findIndex(
        (vehicle) => vehicle.vehicleNumber === vehicleNumber
      );
    }

    const files: Array<any> = req.files;

    const vehicleInfo: IStoreCustomerVehicleInfo =
      storeCustomer.storeCustomerVehicleInfo[vehicleIndex];

    const vehicleImageList: Partial<IVehicleImageList> | any =
      vehicleInfo.vehicleImageList || {
        frontView: {},
        leftView: {},
        seatView: {},
        odometer: {},
        rightView: {},
        backView: {}
      };

    if (!files) {
      throw new Error('Files not found');
    }
    for (const file of files) {
      const fileName:
        | 'frontView'
        | 'leftView'
        | 'seatView'
        | 'odometer'
        | 'rightView'
        | 'backView' = file.originalname?.split('.')[0] || 'frontView';
      const { key, url } = await this.s3Client.uploadFile(
        req.body.vehicleNumber,
        fileName,
        file.buffer
      );
      vehicleImageList[fileName] = { key, docURL: url };
    }

    Logger.info(`<Service>:<VehicleService>:<Upload all images - successful>`);

    Logger.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);

    const updatedVehicle = await StoreCustomer.findOneAndUpdate(
      {
        _id: new Types.ObjectId(req.body.customerId),
        'storeCustomerVehicleInfo.vehicleNumber': vehicleNumber
      },
      {
        $set: {
          [`storeCustomerVehicleInfo.${vehicleIndex}.vehicleImageList`]:
            vehicleImageList
        }
      },
      { returnDocument: 'after' }
    );

    return updatedVehicle;
  }
}
