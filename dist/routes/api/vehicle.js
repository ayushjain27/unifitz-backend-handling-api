"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const rbac_1 = require("../middleware/rbac");
const inversify_types_1 = require("../../config/inversify.types");
const rbac_enum_1 = require("../../enum/rbac.enum");
const inversify_container_1 = __importDefault(require("../../config/inversify.container"));
const storage = multer_1.default.memoryStorage();
const uploadFiles = (0, multer_1.default)({ storage: storage });
const router = (0, express_1.Router)();
const vehicleInfoController = inversify_container_1.default.get(inversify_types_1.TYPES.VehicleInfoController);
router.post('/addOrUpdateVehicle', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADD_VEHICLE), vehicleInfoController.validate('addVehicle'), vehicleInfoController.addOrUpdateVehicle);
router.post('/getAllVehicleByUser', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADD_VEHICLE), vehicleInfoController.validate('getVehicle'), vehicleInfoController.getAllVehicleByUser);
router.post('/uploadVehicleImages', uploadFiles.array('files'), (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADD_VEHICLE), vehicleInfoController.validate('uploadImages'), vehicleInfoController.uploadVehicleImages);
router.post('/updateOrDeleteVehicleImage', uploadFiles.single('file'), (0, rbac_1.roleAuth)(rbac_enum_1.ACL.ADD_VEHICLE), vehicleInfoController.validate('updateOrDeleteVehicleImage'), vehicleInfoController.updateOrDeleteVehicleImage);
exports.default = router;
//# sourceMappingURL=vehicle.js.map