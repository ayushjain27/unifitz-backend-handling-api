import 'reflect-metadata';
import { Container } from 'inversify';
import { Twilio } from 'twilio';
import AWS from 'aws-sdk';
import { TYPES } from './inversify.types';
import { TwilioService, S3Service } from '../services';
import { s3Config, twilioConfig } from './constants';
import {
  StoreController,
  AdminController,
  CustomerController,
  NotificationController,
  ProductController
} from '../controllers';
import {
  StoreService,
  AdminService,
  CustomerService,
  NotificationService,
  ProductService
} from '../services';

const container = new Container();

container
  .bind<TwilioService>(TYPES.TwilioService)
  .to(TwilioService)
  .inSingletonScope();
container
  .bind<Twilio>(TYPES.Twilio)
  .toConstantValue(new Twilio(twilioConfig.ACC_ID, twilioConfig.AUTH_TOKEN));

container.bind<S3Service>(TYPES.S3Service).to(S3Service).inSingletonScope();
container.bind<AWS.S3>(TYPES.S3Client).toConstantValue(
  new AWS.S3({
    credentials: {
      accessKeyId: s3Config.AWS_KEY_ID,
      secretAccessKey: s3Config.ACCESS_KEY
    }
  })
);

container.bind<StoreService>(TYPES.StoreService).to(StoreService);
container.bind<StoreController>(TYPES.StoreController).to(StoreController);

container.bind<AdminService>(TYPES.AdminService).to(AdminService);
container.bind<AdminController>(TYPES.AdminController).to(AdminController);

container.bind<CustomerService>(TYPES.CustomerService).to(CustomerService);
container
  .bind<CustomerController>(TYPES.CustomerController)
  .to(CustomerController);

container
  .bind<NotificationController>(TYPES.NotificationController)
  .to(NotificationController);

container
  .bind<NotificationService>(TYPES.NotificationService)
  .to(NotificationService);

container
  .bind<ProductController>(TYPES.ProductController)
  .to(ProductController);

container.bind<ProductService>(TYPES.ProductService).to(ProductService);

export default container;
