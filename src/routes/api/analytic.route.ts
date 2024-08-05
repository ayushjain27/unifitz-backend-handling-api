import { Router } from 'express';
// import multer from 'multer';
import { ACL } from '../../enum/rbac.enum';
import { roleAuth } from '../../routes/middleware/rbac';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { AnalyticController } from '../../controllers';

const router: Router = Router();
const analyticController = container.get<AnalyticController>(
  TYPES.AnalyticController
);

router.get('/getTotalConsumers', analyticController.getTotalCustomers);
router.get(
  '/getTotalUsers',
  roleAuth(ACL.STORE_GET_ALL),
  analyticController.getTotalUsers
);

router.get(
  '/getVerifiedStores',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getVerifiedStores
);

router.post(
  '/getAnalyticsMapsData',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getAnalyticsMapsData
);

router.post(
  '/getPlusFeatureData',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getPlusFeatureData
);

// ====================event analytic api lists start=====================
// =======================================================================
router.post('/createEventAnalytic', analyticController.createEventAnalytic);

router.post(
  '/getEventAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getEventAnalytic
);

router.post(
  '/getActiveUser',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getActiveUser
);

router.post(
  '/getUsersByState',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getUsersByState
);

router.post(
  '/getUsersByArea',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getUsersByArea
);

router.post(
  '/getTrafficAnalaytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getTrafficAnalaytic
);

// ====================event analytic api lists ended=====================
// =======================================================================
// router.get('/getTotalCustomers', analyticController.getTotalCustomers);

// ====================Plus Feature analytic api lists start==============
// =======================================================================

router.post('/createPlusFeatures', analyticController.createPlusFeatures);

router.post(
  '/getPlusFeatureAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getPlusFeatureAnalytic
);

router.post(
  '/getAdvertisementAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getAdvertisementAnalytic
);

router.post(
  '/getPlusFeatureAnalyticByCity',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getPlusFeatureAnalyticByCity
);

router.post(
  '/getCategoriesAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getCategoriesAnalytic
);

router.post(
  '/getPlusFeatureAnalyticTypes',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getPlusFeatureAnalyticTypes
);

router.get(
  '/getTotalImpression',
  roleAuth(ACL.STORE_GET_ALL),
  analyticController.getStoreImpressoin
);

// ====================Plus Feature analytic api lists ended==============
// =======================================================================

// ====================Partner analytic api lists start===================
// =======================================================================
router.post('/createPartnerAnalytic', analyticController.createPartnerAnalytic);

router.post(
  '/getPartnerAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getPartnerAnalytic
);

router.post(
  '/getActivePartnerUsers',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getActivePartnerUsers
);

router.post(
  '/getOverallPartnerUsers',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getOverallPartnerUsers
);

// ====================Partner analytic api lists end=====================
// =======================================================================

// ====================Vehicle analytic api lists start===================
// =======================================================================

router.post('/createVehicleAnalytic', analyticController.createVehicleAnalytic);

router.post(
  '/getVehicleImpression',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getVehicleAnalytic
);

router.post(
  '/getBuyVehicleAll',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getBuyVehicleAll
);

// ====================Vehicle analytic api lists end=====================
// =======================================================================

export default router;
