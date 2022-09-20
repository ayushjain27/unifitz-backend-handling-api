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
exports.TwoFactorService = void 0;
const inversify_1 = require("inversify");
const axios_1 = __importDefault(require("axios"));
const constants_1 = require("../config/constants");
let TwoFactorService = class TwoFactorService {
    sendVerificationCode(phoneNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${constants_1.twoFactorConfig.URL}/${constants_1.twoFactorConfig.API_KEY}/SMS/${phoneNumber}/AUTOGEN3/${constants_1.twoFactorConfig.TEMPLATE_NAME}`;
            try {
                const res = yield axios_1.default.get(url);
                return res.data;
            }
            catch (err) {
                throw new Error(err);
            }
        });
    }
    verifyCode(phoneNumber, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `${constants_1.twoFactorConfig.URL}/${constants_1.twoFactorConfig.API_KEY}/SMS/VERIFY3/${phoneNumber}/${code}`;
            try {
                const res = yield axios_1.default.get(url);
                return res.data;
            }
            catch (err) {
                throw new Error(err);
            }
        });
    }
};
TwoFactorService = __decorate([
    (0, inversify_1.injectable)()
], TwoFactorService);
exports.TwoFactorService = TwoFactorService;
//# sourceMappingURL=twoFactor.service.js.map