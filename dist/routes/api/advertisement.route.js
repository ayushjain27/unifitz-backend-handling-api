"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const rbac_enum_1 = require("../../enum/rbac.enum");
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const rbac_1 = require("../middleware/rbac");
const storage = multer_1.default.memoryStorage();
const uploadFile = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
const adController = inversify_container_1.default.get(inversify_types_1.TYPES.AdvertisementController);
// upload banner API
router.post('/uploadBanner', uploadFile.single('file'), (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADVERTISEMENT_CREATE), adController.validate('uploadBanner'), adController.uploadBanner);
router.get('/getAllBanner', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADVERTISEMENT_CREATE), adController.getAllBanner);
router.get('/getCustBanners', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADVERTISEMENT_GET_CUSTOMER), adController.getAllBannerForCustomer);
exports.default = router;
//# sourceMappingURL=advertisement.route.js.map