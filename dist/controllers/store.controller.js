"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
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
exports.StoreController = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const inversify_1 = require("inversify");
const store_service_1 = require("../services/store.service");
const winston_1 = __importDefault(require("../config/winston"));
const inversify_types_1 = require("../config/inversify.types");
let StoreController = class StoreController {
    constructor(storeService) {
        this.createStore = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeRequest = req.body;
            winston_1.default.info('<Controller>:<StoreController>:<Onboarding request controller initiated>');
            try {
                const result = yield this.storeService.create(storeRequest);
                res.send({
                    message: 'Store Onboarding Successful',
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.updateStore = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeRequest = req.body;
            winston_1.default.info('<Controller>:<StoreController>:<Onboarding request controller initiated>');
            try {
                const result = yield this.storeService.update(storeRequest);
                res.send({
                    message: 'Store Updation Successful',
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getStores = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeId = req.query.storeId;
            winston_1.default.info('<Controller>:<StoreController>:<Get All stores request controller initiated>');
            try {
                let result;
                if (storeId) {
                    result = yield this.storeService.getById(storeId);
                }
                else {
                    result = yield this.storeService.getAll();
                }
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getStoresByOwner = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const userId = req.params.userId;
            winston_1.default.info('<Controller>:<StoreController>:<Get stores by owner request controller initiated>');
            try {
                const result = yield this.storeService.getByOwner(userId);
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.uploadFile = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeDocUploadRequest = req.body;
            winston_1.default.info('---------------------');
            winston_1.default.info('req body is', req.body, req.file);
            winston_1.default.info('---------------------');
            winston_1.default.info('<Controller>:<StoreController>:<Upload file request controller initiated>');
            try {
                const result = yield this.storeService.uploadFile(storeDocUploadRequest, req);
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getOverallStoreRatings = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeId = req.params.storeId;
            winston_1.default.info('<Controller>:<StoreController>:<Get stores ratings>');
            try {
                const result = yield this.storeService.getOverallRatings(storeId);
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.addStoreReview = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeReview = req.body;
            winston_1.default.info('<Controller>:<StoreController>:<Create store ratings>');
            try {
                const result = yield this.storeService.addReview(storeReview);
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getStoreReviews = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const storeId = req.params.storeId;
            winston_1.default.info('<Controller>:<StoreController>:<Get stores reviews>');
            try {
                const result = yield this.storeService.getReviews(storeId);
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.storeService = storeService;
    }
};
StoreController = __decorate([
    inversify_1.injectable(),
    __param(0, inversify_1.inject(inversify_types_1.TYPES.StoreService)),
    __metadata("design:paramtypes", [store_service_1.StoreService])
], StoreController);
exports.StoreController = StoreController;
//# sourceMappingURL=store.controller.js.map