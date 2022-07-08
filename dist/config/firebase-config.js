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
exports.connectFirebaseAdmin = exports.firebaseAdmin = void 0;
const firebase_admin_1 = __importStar(require("firebase-admin"));
const firebase_adminsdk_json_1 = __importDefault(require("./firebase-adminsdk.json"));
const connectFirebaseAdmin = () => __awaiter(void 0, void 0, void 0, function* () {
    const params = {
        type: firebase_adminsdk_json_1.default.type,
        projectId: firebase_adminsdk_json_1.default.project_id,
        privateKeyId: firebase_adminsdk_json_1.default.private_key_id,
        privateKey: firebase_adminsdk_json_1.default.private_key,
        clientEmail: firebase_adminsdk_json_1.default.client_email,
        clientId: firebase_adminsdk_json_1.default.client_id,
        authUri: firebase_adminsdk_json_1.default.auth_uri,
        tokenUri: firebase_adminsdk_json_1.default.token_uri,
        authProviderX509CertUrl: firebase_adminsdk_json_1.default.auth_provider_x509_cert_url,
        clientC509CertUrl: firebase_adminsdk_json_1.default.client_x509_cert_url
    };
    (0, firebase_admin_1.initializeApp)({
        credential: firebase_admin_1.credential.cert(params)
    });
});
exports.connectFirebaseAdmin = connectFirebaseAdmin;
const _admin = firebase_admin_1.default;
exports.firebaseAdmin = _admin;
//# sourceMappingURL=firebase-config.js.map