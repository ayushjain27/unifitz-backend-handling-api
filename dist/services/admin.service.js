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
exports.AdminService = void 0;
const inversify_1 = require("inversify");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_1 = __importDefault(require("../models/Admin"));
const winston_1 = __importDefault(require("../config/winston"));
const utils_1 = require("../utils");
let AdminService = class AdminService {
    create(userName, password) {
        return __awaiter(this, void 0, void 0, function* () {
            let admin = yield Admin_1.default.findOne({ userName });
            if (admin) {
                throw new Error('Admin already exists');
            }
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashed = yield bcryptjs_1.default.hash(password, salt);
            // Build user object based on IAdmin
            const adminFields = {
                userName,
                password: hashed
            };
            admin = new Admin_1.default(adminFields);
            yield admin.save();
            winston_1.default.info('<Controller>:<AdminService>:<Admin created successfully>');
            return userName;
        });
    }
    login(userName, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const admin = yield Admin_1.default.findOne({ userName });
            if (admin) {
                winston_1.default.info('<Controller>:<AdminService>:<Admin present in DB>');
                if (!(yield bcryptjs_1.default.compare(password, admin.password))) {
                    throw new Error('Password validation failed');
                }
                winston_1.default.info('<Controller>:<AdminService>:<Admin password validated successfully>');
            }
            const payload = {
                userId: admin.userName,
                role: admin.role
            };
            return yield (0, utils_1.generateToken)(payload);
        });
    }
};
AdminService = __decorate([
    (0, inversify_1.injectable)()
], AdminService);
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map