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
const storeController = inversify_container_1.default.get(inversify_types_1.TYPES.StoreController);
// @route   POST v1/store/
// @desc    Onboard store
// @access  Private
router.post('/', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_CREATE), storeController.createStore);
router.put('/', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_CREATE), storeController.updateStore);
router.get('/', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_GET_SINGLE), storeController.getStoreByStoreId);
router.get('/allStores', 
// roleAuth(ACL.STORE_GET_ALL),
storeController.getAllStores);
router.get('/search', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_GET_ALL), storeController.searchStores);
router.post('/search_paginated', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_GET_ALL), storeController.searchStoresPaginated);
router.get('/owner/:userId', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_GET_OWNER), storeController.getStoresByOwner);
router.post('/uploadFile', uploadFile.single('file'), (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_CREATE), storeController.uploadFile);
router.post('/review', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_REVIEW_CREATE), storeController.addStoreReview);
router.get('/:storeId/ratings', storeController.getOverallStoreRatings);
router.get('/:storeId/reviews', storeController.getStoreReviews);
router.put('/updateStatus', (0, rbac_1.roleAuth)(rbac_enum_1.ACL.STORE_CREATE), storeController.updateStoreStatus);
exports.default = router;
//# sourceMappingURL=store.js.map