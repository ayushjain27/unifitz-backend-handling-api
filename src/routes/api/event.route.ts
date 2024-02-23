import { Router } from 'express';
import multer from 'multer';

import container from '../../config/inversify.container';
import { TYPES } from '../../config/inversify.types';
import { roleAuth } from '../../routes/middleware/rbac';
import { ACL } from '../../enum/rbac.enum';
import { EventController } from '../../controllers';

const storage = multer.memoryStorage();
const uploadFile = multer({ storage: storage });

const router: Router = Router();
const eventController = container.get<EventController>(TYPES.EventController);

router.post('/', eventController.createEvent);

router.post(
  '/uploadImage',
  uploadFile.single('file'),
  eventController.uploadImage
);

router.post('/getAllEvent', eventController.getAllEvent);

router.get('/getAllEventByInterest', eventController.getAllEventByInterest);

router.get('/getEventById', eventController.getEventById);

router.put('/updateEvent/:eventId', eventController.updateEvent);

router.delete('/deleteEvent', eventController.deleteEvent);

router.post('/updateEventStatus', eventController.updateEventStatus);

router.post('/addToInterest', eventController.addToInterest);

router.get('/getAllInterest', eventController.getAllInterest);

export default router;
