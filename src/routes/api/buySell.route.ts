import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { BuySellController } from './../../controllers/buySell.controller';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const buySellController = container.get<BuySellController>(
  TYPES.BuySellController
);

router.post(
  '/addToSellVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.validate('addorGetSellVehicle'),
  buySellController.addSellVehicle
);

// router.post(
//   '/getAllSellVehicleByUser',
//   roleAuth(ACL.ADD_VEHICLE),
//   // buySellController.validate('addorGetSellVehicle'),
//   buySellController.getAllSellVehicleByUser
// );

// router.post(
//   '/getBuySellVehicleById',
//   roleAuth(ACL.ADD_VEHICLE),
//   // buySellController.validate('addorGetSellVehicle'),
//   buySellController.getBuyVehicleById
// );

router.put(
  '/updateSellVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.updateSellVehicle
);

router.post(
  '/getAllBuyVehicle',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getAllBuyVehicle
);

router.post(
  '/getAllBuyVehiclePaginated',
  // roleAuth(ACL.STORE_GET_ALL),
  buySellController.getAllBuyVehiclePaginated
);

router.post('/getBuyVehicle', buySellController.getBuyVehicle);
router.post(
  '/vehicleExistanceCheckApi',
  buySellController.checkVehicleExistance
);
router.get('/getBuySellAggregation', buySellController.getOwnStoreDetails);
router.post(
  '/addBuySellVehicleImageList',
  uploadFile.array('files'),
  buySellController.addBuySellVehicleImageList
);

router.post('/updateStatus', buySellController.updateBuySellVehicleStatus);

router.post('/all', roleAuth(ACL.ADD_VEHICLE), buySellController.getAll);
router.post(
  '/priceCount',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getAllBuySellVehilceCount
);
router.post(
  '/paginated/all',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getPaginatedAll
);

router.post(
  '/countAll',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getTotalBuySellCount
);

router.get(
  '/getBuySellDetailsByVehicleId',
  roleAuth(ACL.ADD_VEHICLE),
  buySellController.getBuySellDetailsByVehicleId
);

router.get(
  '/getBuySellDetailsById',
  buySellController.getBuySellDetailsById
);

router.delete(
  '/:vehicleId',
  roleAuth(ACL.STORE_CREATE),
  buySellController.deleteVehicle
);

router.post(
  '/updateCustomerDetails',
  buySellController.updateBuySellVehicleCustomerDetails
);

router.post(
  '/uploadPanAadharImage',
  uploadFile.single('file'),
  buySellController.uploadPanAadharImage
);

router.post(
  '/getBuyVehicleList',
  // roleAuth(ACL.STORE_GET_ALL),
  buySellController.getBuyVehicleList
);

export default router;
