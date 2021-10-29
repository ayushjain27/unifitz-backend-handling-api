import config from 'config';
import { Response, NextFunction } from 'express';
import HttpStatusCodes from 'http-status-codes';
import jwt from 'jsonwebtoken';

import Payload from '../../types/payload';
import Request from '../../types/request';
import Logger from '../../config/winston';
import { RBAC_MAP } from '../../config/rbac-mapping';

export const roleAuth = (credentials: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): Response => {
    Logger.info('RBAC middleware');
    // Allow for a string OR array
    if (typeof credentials === 'string') {
      credentials = [credentials];
    }
    const token = req.headers['authorization'];
    if (!token) {
      return res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ msg: 'No token, authorization denied' });
    }
    const tokenBody = token.slice(7);
    try {
      /* eslint-disable */
      const decoded: Payload | any = jwt.verify(
        tokenBody,
        config.get('JWT_SECRET')
      );
      if (credentials.length > 0) {
        const getUserACL = RBAC_MAP[decoded.role.toLowerCase()];
        req.role = decoded.role;
        if (
          getUserACL &&
          getUserACL.length > 0 &&
          credentials.some((cred) => getUserACL.includes(cred))
        ) {
          next();
        } else {
          return res.status(401).send('Error: Access Denied');
        }
      } else {
        // No credentials required, user is authorized
        next();
      }
    } catch (err) {
      res
        .status(HttpStatusCodes.UNAUTHORIZED)
        .json({ msg: 'Token is not valid' });
    }
  };
};
