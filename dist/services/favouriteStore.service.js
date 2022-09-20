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
exports.FavouriteStoreService = void 0;
const mongoose_1 = require("mongoose");
const inversify_1 = require("inversify");
const lodash_1 = __importDefault(require("lodash"));
const winston_1 = __importDefault(require("../config/winston"));
const FavouriteStore_1 = __importDefault(require("../models/FavouriteStore"));
const Store_1 = __importDefault(require("./../models/Store"));
const Customer_1 = __importDefault(require("./../models/Customer"));
let FavouriteStoreService = class FavouriteStoreService {
    addToFavourite(favStore) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<FavouriteStoreService>: <Adding to favourite intiiated>');
            const { customerId, storeId } = favStore;
            // Check if store exists
            const store = yield Store_1.default.findOne({ storeId }).lean();
            if (lodash_1.default.isEmpty(store)) {
                throw new Error('Store not found');
            }
            // Check if Customer exists
            const customer = yield Customer_1.default.findOne({
                _id: new mongoose_1.Types.ObjectId(customerId)
            }).lean();
            if (lodash_1.default.isEmpty(customer)) {
                throw new Error('Customer not found');
            }
            const currentFavStore = yield FavouriteStore_1.default.findOne({
                storeId: favStore.storeId,
                customerId: new mongoose_1.Types.ObjectId(favStore.customerId)
            }).lean();
            if (!lodash_1.default.isEmpty(currentFavStore)) {
                const res = yield FavouriteStore_1.default.findOneAndUpdate({ _id: currentFavStore._id }, {
                    $set: { isFavourite: true }
                }, { returnDocument: 'after' });
                return res;
            }
            const newFavStore = {
                customerId: new mongoose_1.Types.ObjectId(customerId),
                storeId,
                isFavourite: true
            };
            // Add the request to favourite collections
            const newFavItem = yield FavouriteStore_1.default.create(newFavStore);
            return newFavItem;
        });
    }
    removeFromFavourite(favId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<FavouriteStoreService>: <Removing items favourite intiiated>');
            const res = yield FavouriteStore_1.default.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(favId) }, {
                $set: { isFavourite: false }
            }, { returnDocument: 'after' });
            return res;
        });
    }
    checkFavStore(favStore) {
        return __awaiter(this, void 0, void 0, function* () {
            const favStoreDb = yield FavouriteStore_1.default.findOne({
                storeId: favStore.storeId,
                customerId: new mongoose_1.Types.ObjectId(favStore.customerId)
            }).lean();
            if (lodash_1.default.isEmpty(favStoreDb)) {
                return { isFavourite: false, favouriteId: null };
            }
            else {
                return {
                    isFavourite: favStoreDb.isFavourite,
                    favouriteId: favStoreDb === null || favStoreDb === void 0 ? void 0 : favStoreDb._id
                };
            }
        });
    }
    getAllFavStore(allFavReq) {
        return __awaiter(this, void 0, void 0, function* () {
            const { pageSize, pageNo, customerId } = allFavReq;
            const allFavStore = yield FavouriteStore_1.default.aggregate([
                {
                    $match: { customerId: new mongoose_1.Types.ObjectId(customerId) }
                },
                {
                    $lookup: {
                        from: 'stores',
                        localField: 'storeId',
                        foreignField: 'storeId',
                        as: 'storeInfo'
                    }
                },
                { $unwind: { path: '$storeInfo' } }
            ])
                .limit(pageSize)
                .skip(pageNo * pageSize);
            // const allFavStore: IFavouriteStore = await FavouriteStore.find({
            //   customerId: new Types.ObjectId(customerId)
            // })
            //   .limit(pageSize)
            //   .skip(pageNo * pageSize)
            //   .lean();
            return allFavStore;
        });
    }
};
FavouriteStoreService = __decorate([
    (0, inversify_1.injectable)()
], FavouriteStoreService);
exports.FavouriteStoreService = FavouriteStoreService;
//# sourceMappingURL=favouriteStore.service.js.map