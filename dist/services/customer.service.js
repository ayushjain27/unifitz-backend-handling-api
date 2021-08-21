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
exports.CustomerService = void 0;
const inversify_1 = require("inversify");
const mongoose_1 = require("mongoose");
const winston_1 = __importDefault(require("../config/winston"));
const Customer_1 = __importDefault(require("./../models/Customer"));
let CustomerService = class CustomerService {
    create(customerPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<CustomerService>: <Customer onboarding: creating new customer>');
            const newCustomer = yield Customer_1.default.create(customerPayload);
            winston_1.default.info('<Service>:<CustomerService>:<Customer created successfully>');
            return newCustomer;
        });
    }
    update(customerId, customerPayload) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<CustomerService>: <Customer onboarding: creating new customer>');
            yield Customer_1.default.findOneAndUpdate({
                _id: new mongoose_1.Types.ObjectId(customerId)
            }, customerPayload);
            const updatedCustomerPayload = Customer_1.default.findById(new mongoose_1.Types.ObjectId(customerId));
            winston_1.default.info('<Service>:<CustomerService>:<Customer updated successfully>');
            return updatedCustomerPayload;
        });
    }
    getByPhoneNumber(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<StoreService>:<Get stores by Id service initiated>');
            const customerResponse = yield Customer_1.default.findOne({
                phoneNumber
            }).lean();
            return customerResponse;
        });
    }
};
CustomerService = __decorate([
    inversify_1.injectable()
], CustomerService);
exports.CustomerService = CustomerService;
//# sourceMappingURL=customer.service.js.map