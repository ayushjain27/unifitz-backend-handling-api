"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const rbac_1 = require("../../routes/middleware/rbac");
const rbac_enum_1 = require("../../enum/rbac.enum");
const storage = multer_1.default.memoryStorage();
const uploadFile = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
const jobCardController = inversify_container_1.default.get(inversify_types_1.TYPES.JobCardController);
router.post('/', uploadFile.array('files', 10), (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_CREATE), jobCardController.validate('createJobCard'), jobCardController.createJobCard);
exports.default = router;
//# sourceMappingURL=jobCard.route.js.map