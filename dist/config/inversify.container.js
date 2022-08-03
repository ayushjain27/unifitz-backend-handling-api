"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const inversify_1 = require("inversify");
const twilio_1 = require("twilio");
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const inversify_types_1 = require("./inversify.types");
const services_1 = require("../services");
const constants_1 = require("./constants");
const controllers_1 = require("../controllers");
const services_2 = require("../services");
const container = new inversify_1.Container();
container
    .bind(inversify_types_1.TYPES.TwilioService)
    .to(services_1.TwilioService)
    .inSingletonScope();
container
    .bind(inversify_types_1.TYPES.Twilio)
    .toConstantValue(new twilio_1.Twilio(constants_1.twilioConfig.ACC_ID, constants_1.twilioConfig.AUTH_TOKEN));
container.bind(inversify_types_1.TYPES.S3Service).to(services_1.S3Service).inSingletonScope();
container.bind(inversify_types_1.TYPES.S3Client).toConstantValue(new aws_sdk_1.default.S3({
    credentials: {
        accessKeyId: constants_1.s3Config.AWS_KEY_ID,
        secretAccessKey: constants_1.s3Config.ACCESS_KEY
    }
}));
container.bind(inversify_types_1.TYPES.StoreService).to(services_2.StoreService);
container.bind(inversify_types_1.TYPES.StoreController).to(controllers_1.StoreController);
container.bind(inversify_types_1.TYPES.AdminService).to(services_2.AdminService);
container.bind(inversify_types_1.TYPES.AdminController).to(controllers_1.AdminController);
container.bind(inversify_types_1.TYPES.CustomerService).to(services_2.CustomerService);
container
    .bind(inversify_types_1.TYPES.CustomerController)
    .to(controllers_1.CustomerController);
container
    .bind(inversify_types_1.TYPES.NotificationController)
    .to(controllers_1.NotificationController);
container
    .bind(inversify_types_1.TYPES.NotificationService)
    .to(services_2.NotificationService);
container
    .bind(inversify_types_1.TYPES.ProductController)
    .to(controllers_1.ProductController);
container.bind(inversify_types_1.TYPES.ProductService).to(services_2.ProductService);
container
    .bind(inversify_types_1.TYPES.JobCardController)
    .to(controllers_1.JobCardController);
container.bind(inversify_types_1.TYPES.JobCardService).to(services_2.JobCardService);
exports.default = container;
//# sourceMappingURL=inversify.container.js.map