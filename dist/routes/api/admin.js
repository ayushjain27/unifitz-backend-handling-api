"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const inversify_types_1 = require("../../config/inversify.types");
const router = (0, express_1.Router)();
const adminController = inversify_container_1.default.get(inversify_types_1.TYPES.AdminController);
// @route   POST api/admin
// @desc    Register admin given their userName and password, returns the token upon successful registration
// @access  Private
router.post('/', adminController.create);
router.post('/login', adminController.login);
exports.default = router;
//# sourceMappingURL=admin.js.map