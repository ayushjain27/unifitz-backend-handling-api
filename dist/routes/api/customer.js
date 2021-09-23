"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rbac_enum_1 = require("../../enum/rbac.enum");
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const rbac_1 = require("../middleware/rbac");
const router = express_1.Router();
const customerController = inversify_container_1.default.get(inversify_types_1.TYPES.CustomerController);
// @route   POST api/customer
// @access  Private
router.post('/', rbac_1.roleAuth(rbac_enum_1.ACL.CUSTOMER_CREATE), customerController.create);
router.put('/:customerId', rbac_1.roleAuth(rbac_enum_1.ACL.CUSTOMER_CREATE), customerController.update);
router.post('/customerByPhoneNo', rbac_1.roleAuth(rbac_enum_1.ACL.CUSTOMER_CREATE), customerController.getCustomerByPhoneNo);
router.get('/all', rbac_1.roleAuth(rbac_enum_1.ACL.CUSTOMER_GET_ALL), customerController.getAll);
exports.default = router;
//# sourceMappingURL=customer.js.map