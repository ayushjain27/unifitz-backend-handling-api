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
exports.ProductService = void 0;
const inversify_1 = require("inversify");
const inversify_container_1 = __importDefault(require("../config/inversify.container"));
const mongoose_1 = require("mongoose");
const inversify_types_1 = require("../config/inversify.types");
const winston_1 = __importDefault(require("../config/winston"));
const Product_1 = __importDefault(require("./../models/Product"));
const Store_1 = __importDefault(require("../models/Store"));
let ProductService = class ProductService {
    constructor() {
        this.s3Client = inversify_container_1.default.get(inversify_types_1.TYPES.S3Service);
    }
    create(productPayload, req) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<ProductService>: <Product Creation: creating new product>');
            // check if store id exist
            const { storeId } = productPayload;
            const file = req.file;
            let store;
            if (storeId) {
                store = yield Store_1.default.findOne({ storeId });
            }
            if (!store) {
                winston_1.default.error('<Service>:<ProductService>:<Upload file - store id not found>');
                throw new Error('Store not found');
            }
            let newProd = productPayload;
            if (file) {
                const { key, url } = yield this.s3Client.uploadFile(storeId, file.originalname, file.buffer);
                newProd.refImage = { key, docURL: url };
            }
            newProd = yield Product_1.default.create(newProd);
            winston_1.default.info('<Service>:<ProductService>:<Product created successfully>');
            return newProd;
        });
    }
    getAllProductsByStoreId(storeId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<ProductService>: <Product Fetch: getting all the products by store id>');
            const products = yield Product_1.default.find({ storeId }).lean();
            winston_1.default.info('<Service>:<ProductService>:<Product fetched successfully>');
            return products;
        });
    }
    deleteProduct(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<ProductService>: <Product Delete: deleting product by product id>');
            const res = yield Product_1.default.deleteMany({
                _id: new mongoose_1.Types.ObjectId(productId)
            });
            winston_1.default.info('<Service>:<ProductService>:<Product deleted successfully>');
            return res;
        });
    }
    update(productPayload, productId, req) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<ProductService>: <Product Update: updating product>');
            // check if store id exist
            const { storeId } = productPayload;
            const file = req.file;
            let store;
            let product;
            if (productId) {
                product = yield Product_1.default.findOne({
                    productId: new mongoose_1.Types.ObjectId(productId)
                });
            }
            if (!product) {
                winston_1.default.error('<Service>:<ProductService>:<Product not found with that product Id>');
                throw new Error('Store not found');
            }
            if (storeId) {
                store = yield Store_1.default.findOne({ storeId });
            }
            if (!store) {
                winston_1.default.error('<Service>:<ProductService>:<Store note found>');
                throw new Error('Store not found');
            }
            let updatedProd = productPayload;
            if (file) {
                const { key, url } = yield this.s3Client.uploadFile(storeId, file.originalname, file.buffer);
                updatedProd.refImage = { key, docURL: url };
            }
            updatedProd = yield Product_1.default.findOneAndUpdate({ _id: new mongoose_1.Types.ObjectId(productId) }, updatedProd);
            winston_1.default.info('<Service>:<ProductService>:<Product created successfully>');
            return updatedProd;
        });
    }
};
ProductService = __decorate([
    (0, inversify_1.injectable)()
], ProductService);
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map