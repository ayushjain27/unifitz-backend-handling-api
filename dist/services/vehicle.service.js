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
exports.VehicleInfoService = void 0;
const Vehicle_1 = __importDefault(require("./../models/Vehicle"));
const mongoose_1 = require("mongoose");
const inversify_1 = require("inversify");
const lodash_1 = __importDefault(require("lodash"));
const winston_1 = __importDefault(require("../config/winston"));
const inversify_container_1 = __importDefault(require("../config/inversify.container"));
const inversify_types_1 = require("../config/inversify.types");
const User_1 = __importDefault(require("./../models/User"));
let VehicleInfoService = class VehicleInfoService {
    constructor() {
        this.s3Client = inversify_container_1.default.get(inversify_types_1.TYPES.S3Service);
    }
    addOrUpdateVehicle(vehicleStore) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<VehicleService>: <Adding Vehicle intiiated>');
            const { vehicleId, userId, purpose, manufactureYear, ownership, vehicleType, vehicleImageList, vehicleNumber, category, brand, modelName, fuel } = vehicleStore;
            // Check if user exists
            const user = yield User_1.default.findOne({
                userId: new mongoose_1.Types.ObjectId(userId)
            }).lean();
            if (lodash_1.default.isEmpty(user)) {
                throw new Error('User not found');
            }
            const newVehicleStore = {
                userId: new mongoose_1.Types.ObjectId(userId),
                purpose,
                manufactureYear,
                ownership,
                vehicleType,
                vehicleImageList,
                vehicleNumber,
                category,
                brand,
                modelName,
                fuel
            };
            let newVehicleItem;
            if (lodash_1.default.isEmpty(vehicleId)) {
                newVehicleItem = yield Vehicle_1.default.create(newVehicleStore);
            }
            else {
                newVehicleItem = yield Vehicle_1.default.findOneAndUpdate({
                    _id: new mongoose_1.Types.ObjectId(vehicleId)
                }, newVehicleStore, { returnDocument: 'after' });
            }
            return newVehicleItem;
        });
    }
    getAllVehicleByUser(getVehicleRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, purpose } = getVehicleRequest;
            // Check if user exists
            const user = yield User_1.default.findOne({
                userId: new mongoose_1.Types.ObjectId(userId)
            }).lean();
            if (lodash_1.default.isEmpty(user)) {
                throw new Error('User not found');
            }
            const allVehicles = yield Vehicle_1.default.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                purpose
            }).lean();
            return allVehicles;
        });
    }
    uploadVehicleImages(vehicleId, req) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<VehicleService>:<Upload Banner initiated>');
            const vehicleInfo = yield Vehicle_1.default.findOne({
                _id: new mongoose_1.Types.ObjectId(vehicleId)
            });
            if (lodash_1.default.isEmpty(vehicleInfo)) {
                throw new Error('Vehicle does not exist');
            }
            const files = req.files;
            if (!files) {
                throw new Error('Files not found');
            }
            const vehicleImages = [];
            for (const file of files) {
                const fileName = file.originalname;
                const { key, url } = yield this.s3Client.uploadFile('vehicle', fileName, file.buffer);
                const vehImage = { title: fileName, key, url };
                vehicleImages.push(vehImage);
                winston_1.default.info(`<Service>:<VehicleService>:<Upload file for ${fileName} - successful>`);
            }
            winston_1.default.info(`<Service>:<VehicleService>:<Upload all images - successful>`);
            winston_1.default.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);
            const updatedVehicle = yield Vehicle_1.default.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(vehicleId)
            }, {
                $set: {
                    vehicleImageList: vehicleImages
                }
            }, { returnDocument: 'after' });
            return updatedVehicle;
        });
    }
    updateOrDeleteVehicleImage(reqBody, req) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<VehicleService>:<Upload Banner initiated>');
            const { vehicleId, vehicleImageKey } = reqBody;
            const vehicleInfo = yield Vehicle_1.default.findOne({
                _id: new mongoose_1.Types.ObjectId(vehicleId)
            });
            if (lodash_1.default.isEmpty(vehicleInfo)) {
                throw new Error('Vehicle does not exist');
            }
            const vehImageList = [...vehicleInfo.vehicleImageList];
            const file = req.file;
            if (!vehicleImageKey) {
                throw new Error('No Old Image reference found');
            }
            const updInd = lodash_1.default.findIndex(vehImageList, (vehImg) => vehImg.key === vehicleImageKey);
            if (!file) {
                vehImageList.splice(updInd, 1);
                yield this.s3Client.deleteFile(vehicleImageKey);
            }
            else {
                const { key, url } = yield this.s3Client.replaceFile(vehicleImageKey, file.buffer);
                vehImageList[updInd] = Object.assign(Object.assign({}, vehImageList[updInd]), { key, url });
            }
            winston_1.default.info(`<Service>:<VehicleService>:<Upload all images - successful>`);
            winston_1.default.info(`<Service>:<VehicleService>:<Updating the vehicle info>`);
            const updatedVehicle = yield Vehicle_1.default.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(vehicleId)
            }, {
                $set: {
                    vehicleImageList: vehImageList
                }
            }, { returnDocument: 'after' });
            return updatedVehicle;
        });
    }
};
VehicleInfoService = __decorate([
    (0, inversify_1.injectable)()
], VehicleInfoService);
exports.VehicleInfoService = VehicleInfoService;
//# sourceMappingURL=vehicle.service.js.map