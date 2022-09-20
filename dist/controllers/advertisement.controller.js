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
exports.AdvertisementController = void 0;
const express_validator_1 = require("express-validator");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const inversify_1 = require("inversify");
const inversify_types_1 = require("../config/inversify.types");
const winston_1 = __importDefault(require("../config/winston"));
const advertisement_service_1 = require("./../services/advertisement.service");
let AdvertisementController = class AdvertisementController {
    constructor(adService) {
        this.uploadBanner = (req, res) => __awaiter(this, void 0, void 0, function* () {
            // Validate the request body
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res
                    .status(http_status_codes_1.default.BAD_REQUEST)
                    .json({ errors: errors.array() });
            }
            const uploadBannerReq = req.body;
            winston_1.default.info('<Controller>:<AdvertisementController>:<Upload Banner request initiated>');
            try {
                const result = yield this.adService.uploadBanner(uploadBannerReq, req);
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getAllBanner = (req, res) => __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Controller>:<AdvertisementController>:<Get All Banner request initiated>');
            try {
                const result = yield this.adService.getAllBanner();
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getAllBannerForCustomer = (req, res) => __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Controller>:<AdvertisementController>:<Get All Banner for Customer request initiated>');
            try {
                const result = yield this.adService.getAllBannerForCustomer();
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.validate = (method) => {
            switch (method) {
                case 'uploadBanner':
                    return [
                        (0, express_validator_1.body)('title', 'Title does not exist').exists().isString(),
                        (0, express_validator_1.body)('description', 'Description does not existzz')
                            .exists()
                            .isString()
                    ];
            }
        };
        this.adService = adService;
    }
};
AdvertisementController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(inversify_types_1.TYPES.AdvertisementService)),
    __metadata("design:paramtypes", [advertisement_service_1.AdvertisementService])
], AdvertisementController);
exports.AdvertisementController = AdvertisementController;
//# sourceMappingURL=advertisement.controller.js.map