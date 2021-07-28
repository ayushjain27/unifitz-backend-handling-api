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
const uploadFile = multer_1.default({ storage: storage });
const router = express_1.Router();
const storeController = inversify_container_1.default.get(inversify_types_1.TYPES.StoreController);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_CREATE), storeController.createStore);
router.put('/', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_CREATE), storeController.updateStore);
router.get('/', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_GET_SINGLE), storeController.getStoreByStoreId);
router.get('/allStores', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_GET_ALL), storeController.getAllStores);
router.get('/search/:storeName', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_GET_ALL), storeController.searchStores);
router.get('/owner/:userId', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_GET_OWNER), storeController.getStoresByOwner);
router.post('/uploadFile', uploadFile.single('file'), rbac_1.roleAuth(rbac_enum_1.ACL.STORE_CREATE), storeController.uploadFile);
router.post('/review', rbac_1.roleAuth(rbac_enum_1.ACL.STORE_REVIEW_CREATE), storeController.addStoreReview);
router.get('/:storeId/ratings', storeController.getOverallStoreRatings);
router.get('/:storeId/reviews', storeController.getStoreReviews);
exports.default = router;
//# sourceMappingURL=store.js.map