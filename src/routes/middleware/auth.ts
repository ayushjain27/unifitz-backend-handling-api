import config from 'config';
import { Response, NextFunction } from 'express';
import HttpStatusCodes from 'http-status-codes';
import { validationResult } from 'express-validator';

import jwt from 'jsonwebtoken';

import Payload from '../../types/payload';
import Request from '../../types/request';

export default function (
  req: Request,
  res: Response,
  next: NextFunction
): Response {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ msg: 'No token, authorization denied' });
  }
  // Verify token
  try {
    /* eslint-disable */
    const payload: Payload | any = jwt.verify(token, config.get('JWT_SECRET'));
    req.userId = payload.userId;
    req.role = payload?.role;
    next();
  } catch (err) {
    res
      .status(HttpStatusCodes.UNAUTHORIZED)
      .json({ msg: 'Token is not valid' });
  }
}

export function validationHandler() {
  return async (req: Request | any, res: Response, next: NextFunction) => {
    // to check the validation and throw the reponse error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response = {
        data: errors.array(),
        code: HttpStatusCodes.BAD_REQUEST,
        message: 'Error while validating request body'
      };

      return res.status(HttpStatusCodes.BAD_REQUEST).json(response);
    }
    next();
  };
}
