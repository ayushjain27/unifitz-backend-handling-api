"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const rbac_1 = require("../../routes/middleware/rbac");
const rbac_enum_1 = require("../../enum/rbac.enum");
const router = express_1.Router();
const productController = inversify_container_1.default.get(inversify_types_1.TYPES.ProductController);
router.post('/', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_CREATE), productController.validate('createProduct'), productController.createProduct);
exports.default = router;
//# sourceMappingURL=product.js.map