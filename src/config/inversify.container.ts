import 'reflect-metadata';
import { Container } from 'inversify';
import { Twilio } from 'twilio';
import AWS from 'aws-sdk';
import { TYPES } from './inversify.types';
import { s3Config, twilioConfig } from './constants';
import {
  StoreController,
  AdminController,
  CustomerController,
  NotificationController,
  ProductController,
  JobCardController,
  AdvertisementController,
  FavouriteStoreController,
  VehicleInfoController,
  EnquiryController,
  CategoryController,
  BuySellController,
  EmployeeController,
  AnalyticController,
  ReportController,
  EventController,
  OfferController,
  BusinessController,
  SchoolOfAutoController,
  StoreCustomerController
} from '../controllers';
import {
  StoreService,
  AdminService,
  CustomerService,
  NotificationService,
  ProductService,
  JobCardService,
  AdvertisementService,
  FavouriteStoreService,
  VehicleInfoService,
  TwoFactorService,
  EnquiryService,
  SurepassService,
  CategoryService,
  EmployeeService,
  TwilioService,
  S3Service,
  BuySellService,
  AnalyticService,
  ReportService,
  EventService,
  OfferService,
  BusinessService,
  SchoolOfAutoService,
  StoreCustomerService
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

container
  .bind<EmployeeController>(TYPES.EmployeeController)
  .to(EmployeeController);

container.bind<EmployeeService>(TYPES.EmployeeService).to(EmployeeService);

container
  .bind<JobCardController>(TYPES.JobCardController)
  .to(JobCardController);

container.bind<JobCardService>(TYPES.JobCardService).to(JobCardService);

container
  .bind<AdvertisementController>(TYPES.AdvertisementController)
  .to(AdvertisementController);
container
  .bind<AdvertisementService>(TYPES.AdvertisementService)
  .to(AdvertisementService);

container
  .bind<FavouriteStoreController>(TYPES.FavouriteStoreController)
  .to(FavouriteStoreController);

container
  .bind<FavouriteStoreService>(TYPES.FavouriteStoreService)
  .to(FavouriteStoreService);

container
  .bind<VehicleInfoController>(TYPES.VehicleInfoController)
  .to(VehicleInfoController);

container
  .bind<VehicleInfoService>(TYPES.VehicleInfoService)
  .to(VehicleInfoService);

container
  .bind<EnquiryController>(TYPES.EnquiryController)
  .to(EnquiryController);

container.bind<EnquiryService>(TYPES.EnquiryService).to(EnquiryService);

container
  .bind<AnalyticController>(TYPES.AnalyticController)
  .to(AnalyticController);
container.bind<AnalyticService>(TYPES.AnalyticService).to(AnalyticService);

container
  .bind<CategoryController>(TYPES.CategoryController)
  .to(CategoryController);

container.bind<CategoryService>(TYPES.CategoryService).to(CategoryService);
container.bind<TwoFactorService>(TYPES.TwoFactorService).to(TwoFactorService);

container.bind<SurepassService>(TYPES.SurepassService).to(SurepassService);

container
  .bind<BuySellController>(TYPES.BuySellController)
  .to(BuySellController);

container.bind<BuySellService>(TYPES.BuySellService).to(BuySellService);

container.bind<ReportController>(TYPES.ReportController).to(ReportController);

container.bind<ReportService>(TYPES.ReportService).to(ReportService);

container.bind<EventController>(TYPES.EventController).to(EventController);
container.bind<EventService>(TYPES.EventService).to(EventService);

container.bind<OfferController>(TYPES.OfferController).to(OfferController);
container.bind<OfferService>(TYPES.OfferService).to(OfferService);

container
  .bind<StoreCustomerController>(TYPES.StoreCustomerController)
  .to(StoreCustomerController);
container
  .bind<StoreCustomerService>(TYPES.StoreCustomerService)
  .to(StoreCustomerService);

container
  .bind<BusinessController>(TYPES.BusinessController)
  .to(BusinessController);
container.bind<BusinessService>(TYPES.BusinessService).to(BusinessService);

container
  .bind<SchoolOfAutoController>(TYPES.SchoolOfAutoController)
  .to(SchoolOfAutoController);
container
  .bind<SchoolOfAutoService>(TYPES.SchoolOfAutoService)
  .to(SchoolOfAutoService);

export default container;
