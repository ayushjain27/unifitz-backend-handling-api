import config from 'config';
import { Response, NextFunction } from 'express';
import HttpStatusCodes from 'http-status-codes';
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
