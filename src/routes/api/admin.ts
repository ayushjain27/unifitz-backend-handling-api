import bcrypt from 'bcryptjs';
import { Router, Response } from 'express';
import { validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';

import Payload from '../../types/Payload';
import Request from '../../types/Request';
import Admin, { IAdmin } from '../../models/Admin';
import Logger from '../../config/winston';
import { generateToken } from '../../utils';

const router: Router = Router();

// @route   POST api/admin
// @desc    Register admin given their userName and password, returns the token upon successful registration
// @access  Private
router.post('/', async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(HttpStatusCodes.BAD_REQUEST)
      .json({ errors: errors.array() });
  }

  const { userName, password } = req.body;
  try {
    let admin: IAdmin = await Admin.findOne({ userName });

    if (admin) {
      return res.status(HttpStatusCodes.BAD_REQUEST).json({
        errors: [
          {
            msg: 'Admin already exists'
          }
        ]
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Build user object based on IAdmin
    const adminFields = {
      userName,
      password: hashed
    };

    admin = new Admin(adminFields);

    await admin.save();

    const payload: Payload = {
      userId: admin.userName,
      role: admin.role
    };

    const token = await generateToken(payload);
    res.json({
      message: 'Admin Creation Successful',
      token
    });
  } catch (err) {
    Logger.error(err.message);
    res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send('Server Error');
  }
});

export default router;
