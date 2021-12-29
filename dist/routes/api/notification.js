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
const notificationController = inversify_container_1.default.get(inversify_types_1.TYPES.NotificationController);
// @route   POST api/customer
// @access  Private
router.post('/send', rbac_1.roleAuth(rbac_enum_1.ACL.NOTIFICATION_SEND), notificationController.sendNotification);
exports.default = router;
//# sourceMappingURL=notification.js.map