"use strict";
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
const express_1 = require("express");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const multer_1 = __importDefault(require("multer"));
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const winston_1 = __importDefault(require("../../config/winston"));
const rbac_enum_1 = require("../../enum/rbac.enum");
const rbac_1 = require("../middleware/rbac");
const router = express_1.Router();
const storage = multer_1.default.memoryStorage();
const uploadFile = multer_1.default({ storage: storage });
const s3Client = inversify_container_1.default.get(inversify_types_1.TYPES.S3Service);
// @route   POST api/file
// @access  Private
router.post('/upload', uploadFile.single('file'), rbac_1.roleAuth(rbac_enum_1.ACL.FILE_UPLOAD), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const file = req.file;
    winston_1.default.info('---------------------');
    winston_1.default.info('req body is', req.body, req.file);
    winston_1.default.info('---------------------');
    winston_1.default.info('<Route>:<File Route>:<Upload file request initiated>');
    try {
        const result = yield s3Client.uploadFile(JSON.stringify(new Date().getMilliseconds()), file.originalname, file.buffer);
        res.send({
            result
        });
    }
    catch (err) {
        winston_1.default.error(err.message);
        res.status(http_status_codes_1.default.INTERNAL_SERVER_ERROR).send(err.message);
    }
}));
exports.default = router;
//# sourceMappingURL=file.js.map