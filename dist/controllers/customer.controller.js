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
exports.CustomerController = void 0;
const express_validator_1 = require("express-validator");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const inversify_1 = require("inversify");
const inversify_types_1 = require("../config/inversify.types");
const winston_1 = __importDefault(require("../config/winston"));
const customer_service_1 = require("./../services/customer.service");
let CustomerController = class CustomerController {
    constructor(customerService) {
        this.create = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                return res
                    .status(http_status_codes_1.default.BAD_REQUEST)
                    .json({ errors: errors.array() });
            }
            const customerPayload = req.body;
            winston_1.default.info('<Controller>:<CustomerController>:<Customer creation controller initiated>');
            try {
                const result = yield this.customerService.create(customerPayload);
                res.json({
                    message: 'Customer creation successful',
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.update = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const customerPayload = req.body;
            const customerId = req.params.customerId;
            winston_1.default.info('<Controller>:<CustomerController>:<Customer update controller initiated>');
            try {
                const result = yield this.customerService.update(customerId, customerPayload);
                res.send({
                    message: 'Customer update successful',
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.getCustomerByPhoneNo = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const phoneNumber = req.body.phoneNumber;
            winston_1.default.info('<Controller>:<StoreController>:<Get customer by phone number request controller initiated>');
            try {
                let result;
                if (!phoneNumber) {
                    throw new Error('phoneNumber required');
                }
                else {
                    result = yield this.customerService.getByPhoneNumber(phoneNumber);
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
        this.getAll = (req, res) => __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Controller>:<StoreController>:<Get all customers request controller initiated>');
            try {
                const result = yield this.customerService.getAll();
                res.send({
                    result
                });
            }
            catch (err) {
                winston_1.default.error(err.message);
                res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
            }
        });
        this.customerService = customerService;
    }
};
CustomerController = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(inversify_types_1.TYPES.CustomerService)),
    __metadata("design:paramtypes", [customer_service_1.CustomerService])
], CustomerController);
exports.CustomerController = CustomerController;
//# sourceMappingURL=customer.controller.js.map