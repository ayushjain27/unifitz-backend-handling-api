"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.JobCardService = void 0;
const inversify_1 = require("inversify");
const inversify_container_1 = __importDefault(require("../config/inversify.container"));
const inversify_types_1 = require("../config/inversify.types");
const winston_1 = __importDefault(require("../config/winston"));
const JobCard_1 = __importStar(require("./../models/JobCard"));
const Store_1 = __importDefault(require("../models/Store"));
const lodash_1 = __importDefault(require("lodash"));
let JobCardService = class JobCardService {
    constructor() {
        this.s3Client = inversify_container_1.default.get(inversify_types_1.TYPES.S3Service);
    }
    create(jobCardPayload, req) {
        return __awaiter(this, void 0, void 0, function* () {
            winston_1.default.info('<Service>:<JobCardService>: <JobCard Creation: creating new jobcard>');
            // check if store id exist
            const { storeId } = jobCardPayload;
            const files = req.files;
            let store;
            if (storeId) {
                store = yield Store_1.default.findOne({ storeId });
            }
            if (!store) {
                winston_1.default.error('<Service>:<JobCardService>:<Upload file - store id not found>');
                throw new Error('Store not found');
            }
            let newJobCard = jobCardPayload;
            newJobCard.jobStatus = JobCard_1.JobStatus.CREATED;
            if (files) {
                const promises = [];
                let uploadedKeys;
                lodash_1.default.forEach(files, (file) => {
                    promises.push(this.s3Client
                        .uploadFile(`${storeId}/jobCard`, file.originalname, file.buffer)
                        .then(({ key, url }) => uploadedKeys.push({ key, docURL: url })));
                });
                yield Promise.all(promises);
                newJobCard.refImageList = uploadedKeys;
            }
            newJobCard = yield JobCard_1.default.create(newJobCard);
            winston_1.default.info('<Service>:<JobCardService>:<Job Card created successfully>');
            return newJobCard;
        });
    }
};
JobCardService = __decorate([
    (0, inversify_1.injectable)()
], JobCardService);
exports.JobCardService = JobCardService;
//# sourceMappingURL=jobCard.service.js.map