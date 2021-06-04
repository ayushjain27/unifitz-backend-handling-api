import { NextFunction } from 'express';
/* eslint-disable */
export const wrap =
  (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
