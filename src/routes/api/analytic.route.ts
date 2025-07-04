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

router.post('/getTotalConsumers', roleAuth(ACL.STORE_GET_ALL), analyticController.getTotalCustomers);
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
  '/getCustomerEventAnalytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getCustomerEventAnalytic
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

router.post(
  '/getOverallTrafficAnalaytic',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getOverallTrafficAnalaytic
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
  '/getVehicleImpressionByYear',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getVehicleAnalyticByYear
);

router.post(
  '/getBuyVehicleAll',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getBuyVehicleAll
);

router.post(
  '/getBuyVehicleStore',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getBuyVehicleStore
);

// ====================Vehicle analytic api lists end=====================
// =======================================================================

// ====================NewVehicle analytic api lists start===================
// =======================================================================

router.post('/createNewVehicle', analyticController.createNewVehicle);

router.post(
  '/getNewVehicleImpression',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getNewVehicleImpression
);

router.post(
  '/getNewVehicleAll',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getNewVehicleAll
);

// ====================NewVehicle analytic api lists end=====================
// =======================================================================

// ====================Marketing Video analytic api lists start=====================
// =======================================================================

router.post(
  '/createMarketingAnalytic',
  analyticController.createMarketingAnalytic
);

router.post(
  '/getMarketingImpression',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getMarketingAnalytic
);

router.post(
  '/getMarketingImpressionByYear',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getMarketingImpressionByYear
);

router.post(
  '/getMarketingAll',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getMarketingAll
);

router.post(
  '/marketingPaginated/all',
  roleAuth(ACL.STORE_CREATE),
  analyticController.marketingPaginatedAll
);

router.get(
  '/marketing/getAtiveUsersByHour',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getAtiveUsersByHour
);

router.post(
  '/getMarketingUserByArea',
  roleAuth(ACL.STORE_CREATE),
  analyticController.getMarketingUserByArea
);

// ====================Marketing Video analytic api lists end=====================
// =======================================================================

export default router;
