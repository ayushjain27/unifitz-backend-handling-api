"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
exports.StoreService = void 0;
const inversify_1 = require("inversify");
const mongoose_1 = require("mongoose");
const inversify_container_1 = __importDefault(require("../config/inversify.container"));
const inversify_types_1 = require("../config/inversify.types");
const winston_1 = __importDefault(require("../config/winston"));
const Store_1 = __importDefault(require("../models/Store"));
const Store_Review_1 = __importDefault(require("../models/Store-Review"));
const User_1 = __importDefault(require("../models/User"));
let StoreService = class StoreService {
    constructor() {
        this.s3Client = inversify_container_1.default.get(inversify_types_1.TYPES.S3Service);
    }
    create(storeRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { storePayload, phoneNumber } = storeRequest;
            winston_1.default.info('<Service>:<StoreService>:<Onboarding service initiated>');
            const ownerDetails = yield User_1.default.findOne({
                phoneNumber
            });
            storePayload.userId = ownerDetails._id;
            // const { category, subCategory, brand } = storePayload.basicInfo;
            // const getCategory: ICatalog = await Catalog.findOne({
            //   catalogName: category.name,
            //   parent: 'root'
            // });
            // const getSubCategory: ICatalog = await Catalog.findOne({
            //   tree: `root/${category.name}`,
            //   catalogName: subCategory.name
            // });
            // const getBrand: ICatalog = await Catalog.findOne({
            //   tree: `root/${category.name}/${subCategory.name}`,
            //   catalogName: brand.name
            // });
            // if (getCategory && getBrand) {
            //   storePayload.basicInfo.category._id = getCategory._id;
            //   storePayload.basicInfo.subCategory = subCategory;
            //   storePayload.basicInfo.brand._id = getBrand._id;
            // } else {
            //   throw new Error(`Wrong Catalog Details`);
            // }
            const lastCreatedStoreId = yield Store_1.default.find({})
                .sort({ createdAt: 'desc' })
                .select('storeId')
                .limit(1)
                .exec();
            const storeId = !lastCreatedStoreId[0]
                ? new Date().getFullYear() * 100
                : +lastCreatedStoreId[0].storeId + 1;
            winston_1.default.info('<Route>:<StoreService>: <Store onboarding: creating new store>');
            storePayload.storeId = '' + storeId;
            // const newStore = new Store(storePayload);
            const newStore = yield Store_1.default.create(storePayload);
            winston_1.default.info('<Service>:<StoreService>: <Store onboarding: created new store successfully>');
            return newStore;
        });
    }
    update(storeRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Update store service initiated>');
            const { storePayload } = storeRequest;
            // const { category, subCategory, brand } = storePayload.basicInfo;
            // if (category && subCategory && brand) {
            //   const getCategory: ICatalog = await Catalog.findOne({
            //     catalogName: category.name,
            //     parent: 'root'
            //   });
            //   const getSubCategory: ICatalog = await Catalog.findOne({
            //     tree: `root/${category.name}`,
            //     catalogName: subCategory.name
            //   });
            //   const getBrand: ICatalog = await Catalog.findOne({
            //     tree: `root/${category.name}/${subCategory.name}`,
            //     catalogName: brand.name
            //   });
            //   if (getCategory && getSubCategory && getBrand) {
            //     storePayload.basicInfo.category._id = getCategory._id;
            //     storePayload.basicInfo.subCategory._id = getSubCategory._id;
            //     storePayload.basicInfo.brand._id = getBrand._id;
            //   } else {
            //     throw new Error(`Wrong Catalog Details`);
            //   }
            // }
            winston_1.default.info('<Service>:<StoreService>: <Store: updating new store>');
            yield Store_1.default.findOneAndUpdate({ storeId: storePayload.storeId }, storePayload);
            winston_1.default.info('<Service>:<StoreService>: <Store: update store successfully>');
            const updatedStore = yield Store_1.default.findOne({ storeId: storePayload.storeId });
            return updatedStore;
        });
    }
    getById(storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Get stores by Id service initiated>');
            const storeResponse = yield Store_1.default.find({
                storeId: storeId
            });
            return storeResponse;
        });
    }
    getAll() {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Get all stores service initiated>');
            const stores = yield Store_1.default.find({});
            return stores;
        });
    }
    searchAndFilter(storeName, category, subCategory, brand) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Search and Filter stores service initiated>');
            const query = {
                'basicInfo.businessName': new RegExp(storeName, 'i'),
                'basicInfo.brand.name': brand,
                'basicInfo.category.name': category,
                'basicInfo.subCategory.name': { $in: subCategory },
                profileStatus: 'ONBOARDED'
            };
            if (!brand) {
                delete query['basicInfo.brand.name'];
            }
            if (!category) {
                delete query['basicInfo.category.name'];
            }
            if (!subCategory || subCategory.length === 0) {
                delete query['basicInfo.subCategory.name'];
            }
            if (!storeName) {
                delete query['basicInfo.businessName'];
            }
            winston_1.default.debug(query);
            let stores = yield Store_1.default.find(query).lean();
            if (stores && Array.isArray(stores)) {
                stores = yield Promise.all(stores.map((store) => __awaiter(this, void 0, void 0, function* () {
                    const updatedStore = Object.assign({}, store);
                    updatedStore.overAllRating = yield this.getOverallRatings(updatedStore.storeId);
                    return updatedStore;
                })));
            }
            return stores;
        });
    }
    getByOwner(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Get stores by owner service initiated>');
            const objId = new mongoose_1.Types.ObjectId(userId);
            const stores = yield Store_1.default.find({ userId: objId });
            return stores;
        });
    }
    uploadFile(storeDocUploadRequest, req) {
        return __awaiter(this, void 0, void 0, function* () {
            const { storeId, fileType, placement } = storeDocUploadRequest;
            const file = req.file;
            let store;
            winston_1.default.info('<Service>:<StoreService>:<Upload file service initiated>');
            if (storeDocUploadRequest.storeId) {
                store = yield Store_1.default.findOne({ storeId });
            }
            if (!store) {
                winston_1.default.error('<Service>:<StoreService>:<Upload file - store id not found>');
                throw new Error('Store not found');
            }
            // if (oldFileKey) {
            //   await this.removePreviousFileRef(oldFileKey, fileType, store);
            // }
            const { key, url } = yield this.s3Client.uploadFile(storeId, file.originalname, file.buffer);
            winston_1.default.info('<Service>:<StoreService>:<Upload file - successful>');
            //initializing documents document if absent in store details
            if (!store.documents) {
                yield Store_1.default.findOneAndUpdate({ storeId }, {
                    documents: {
                        storeDocuments: fileType === 'DOC'
                            ? {
                                primary: {
                                    key: placement === 'primary' ? key : '',
                                    docURL: placement === 'primary' ? url : ''
                                },
                                secondary: {
                                    key: placement === 'secondary' ? key : '',
                                    docURL: placement === 'secondary' ? url : ''
                                }
                            }
                            : {
                                primary: { key: '', docURL: '' },
                                secondary: { key: '', docURL: '' }
                            },
                        storeImages: fileType === 'IMG'
                            ? {
                                primary: {
                                    key: placement === 'primary' ? key : '',
                                    docURL: placement === 'primary' ? url : ''
                                },
                                secondary: {
                                    key: placement === 'secondary' ? key : '',
                                    docURL: placement === 'secondary' ? url : ''
                                }
                            }
                            : {
                                primary: { key: '', docURL: '' },
                                secondary: { key: '', docURL: '' }
                            }
                    }
                });
            }
            else {
                fileType === 'DOC'
                    ? (store.documents.storeDocuments[placement] = { key, docURL: url })
                    : (store.documents.storeImages[placement] = {
                        key,
                        docURL: url
                    });
                yield Store_1.default.findOneAndUpdate({ storeId }, {
                    documents: {
                        storeDocuments: store.documents.storeDocuments,
                        storeImages: store.documents.storeImages
                    }
                });
            }
            return {
                message: 'File upload successful'
            };
        });
    }
    // private async removePreviousFileRef(
    //   oldFileKey: string,
    //   fileType: string,
    //   store: IStore
    // ) {
    //   await this.s3Client.deleteFile(oldFileKey);
    //   Logger.info('<Service>:<StoreService>:<Delete file - successful>');
    //   if (fileType === 'DOC') {
    //     if (store.documents && oldFileKey) {
    //       store.documents.storeDocuments = store.documents.storeDocuments.filter(
    //         (doc) => doc.docURL !== oldFileKey
    //       );
    //     }
    //   } else if (fileType === 'IMG') {
    //     if (store.documents && oldFileKey) {
    //       store.documents.storeImages = store.documents.storeImages.filter(
    //         (img) => img.imageURL !== oldFileKey
    //       );
    //     }
    //   } else {
    //     Logger.error('<Service>:<StoreService>:<Upload file - Unknown doc type>');
    //     throw new Error('Invalid document type');
    //   }
    // }
    // private async getS3Files(documents: IDocuments) {
    //   const docBuffer = [];
    //   for (const doc of documents.storeDocuments) {
    //     const s3Response = await this.s3Client.getFile(doc.key);
    //     docBuffer.push(s3Response);
    //   }
    //   for (const img of documents.storeImages) {
    //     const s3Response = await this.s3Client.getFile(img.key);
    //     docBuffer.push(s3Response);
    //   }
    //   return docBuffer;
    // }
    addReview(storeReview) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Add Store Ratings initiate>');
            const newStoreReview = new Store_Review_1.default(storeReview);
            yield newStoreReview.save();
            winston_1.default.info('<Service>:<StoreService>:<Store Ratings added successfully>');
            return newStoreReview;
        });
    }
    getOverallRatings(storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Get Overall Ratings initiate>');
            const storeReviews = yield Store_Review_1.default.find({ storeId });
            if (storeReviews.length === 0) {
                return {
                    allRatings: {
                        5: 100
                    },
                    averageRating: 5,
                    totalRatings: 1,
                    totalReviews: 1
                };
            }
            let ratingsCount = 0;
            let totalRatings = 0;
            let totalReviews = 0;
            const allRatings = {};
            storeReviews.forEach(({ rating, review }) => {
                if (rating)
                    totalRatings++;
                if (review)
                    totalReviews++;
                ratingsCount = ratingsCount + rating;
                if (!allRatings[rating]) {
                    allRatings[rating] = 1;
                }
                else {
                    allRatings[rating]++;
                }
            });
            for (const key in allRatings) {
                allRatings[key] = Math.trunc((allRatings[key] * 100) / storeReviews.length);
            }
            const averageRating = ratingsCount / storeReviews.length;
            winston_1.default.info('<Service>:<StoreService>:<Get Overall Ratings performed successfully>');
            return {
                allRatings,
                averageRating,
                totalRatings,
                totalReviews
            };
        });
    }
    /* eslint-disable */
    getReviews(storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Get Store Ratings initiate>');
            const storeReviews = yield Store_Review_1.default.find({ storeId }).lean();
            winston_1.default.info('<Service>:<StoreService>:<Get Ratings performed successfully>');
            if (storeReviews.length === 0) {
                return [
                    {
                        user: {
                            name: 'Service Plug',
                            profilePhoto: ''
                        },
                        storeId,
                        rating: 5,
                        review: 'Thank you for onboarding with us. May you have a wonderful experience.'
                    }
                ];
            }
            else {
                return storeReviews;
            }
        });
    }
};
StoreService = __decorate([
    inversify_1.injectable()
], StoreService);
exports.StoreService = StoreService;
//# sourceMappingURL=store.service.js.map