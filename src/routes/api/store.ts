import { Router, Response } from 'express';
import HttpStatusCodes from 'http-status-codes';

import Request from '../../types/Request';
import Store, { IStore } from '../../models/Store';
import User, { IUser } from '../../models/User';
import Logger from '../../config/winston';

const router: Router = Router();

// @route   POST api/admin
// @desc    Onboard store given details
// @access  Private
router.put('/', async (req: Request, res: Response) => {
  const storeDetails: IStore = req.body;
  try {
    const store: IStore = await Store.findOne({ uuid: storeDetails.uuid });
    const ownerDetails: IUser = await User.findOne({
      phoneNumber: storeDetails.phoneNumber
    });
    delete storeDetails.phoneNumber;
    storeDetails.userId = ownerDetails._id;
    if (store) {
      storeDetails.storeId = store.storeId;
      Logger.info('Store already exists, updating the store details');
      Store.updateOne(
        { uuid: storeDetails.uuid },
        { ...storeDetails },
        { upsert: true }
      );
      res.json({
        message: 'Store Onboarding Successful',
        storeDetails
      });
    } else {
      Logger.info('Store onboarding: creating new store');
      storeDetails.storeId = Math.floor(100000 + Math.random() * 900000);
      const newStore = new Store(storeDetails);
      newStore.save();
      res.json({
        message: 'Store Onboarding Successful',
        newStore
      });
    }
  } catch (err) {
    Logger.error(err.message);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
  }
});

export default router;
