"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvertisementService = void 0;
const inversify_1 = require("inversify");
const winston_1 = __importDefault(require("../config/winston"));
const inversify_container_1 = __importDefault(require("../config/inversify.container"));
const inversify_types_1 = require("../config/inversify.types");
const Banner_1 = __importStar(require("./../models/advertisement/Banner"));
const lodash_1 = __importDefault(require("lodash"));
let AdvertisementService = class AdvertisementService {
    constructor() {
        this.s3Client = inversify_container_1.default.get(inversify_types_1.TYPES.S3Service);
    }
    uploadBanner(bannerUploadRequest, req) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<AdvertisementService>:<Upload Banner initiated>');
            const { title, description, altText, status } = bannerUploadRequest;
            const file = req.file;
            if (!file) {
                throw new Error('File not found');
            }
            const { key, url } = yield this.s3Client.uploadFile('advertisement', file.originalname, file.buffer);
            winston_1.default.info('<Service>:<AdvertisementService>:<Upload file - successful>');
            const newBanner = {
                title,
                description,
                altText: lodash_1.default.isEmpty(altText) ? key : altText,
                slugUrl: key,
                url,
                status: lodash_1.default.isEmpty(status) ? Banner_1.BannerStatus.ACTIVE : status
            };
            const createdBanner = yield Banner_1.default.create(newBanner);
            return createdBanner;
        });
    }
    getAllBanner() {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<AdvertisementService>:<Get All Banner initiated>');
            const banners = yield Banner_1.default.find().lean();
            return banners;
        });
    }
    getAllBannerForCustomer() {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<AdvertisementService>:<Get All Banner for customer initiated>');
            const banners = yield Banner_1.default.find({
                status: Banner_1.BannerStatus.ACTIVE
            })
                .limit(4)
                .lean();
            winston_1.default.info('<Service>:<AdvertisementService>:<Get All Banner for customer completed>');
            return banners;
        });
    }
};
AdvertisementService = __decorate([
    (0, inversify_1.injectable)()
], AdvertisementService);
exports.AdvertisementService = AdvertisementService;
//# sourceMappingURL=advertisement.service.js.map