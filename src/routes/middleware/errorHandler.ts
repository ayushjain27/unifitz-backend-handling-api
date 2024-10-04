import { Request, Response, NextFunction } from 'express';
import logger from '../../config/winston';
import { validationResult } from 'express-validator';
import HttpStatusCodes from 'http-status-codes';

import HttpException from '../../exceptions/httpException.exception';
import ResponseModel from '../../models/Response';

function errorMiddleware(
  error: HttpException,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(error.toString());
  // res.;
  return res.status(error.status || 500).json({
    error: {
      message: error?.message,
      status: error?.status || 500
    }
  });
  // return res.send(error);
}
export function validationHandler() {
  return async (req: Request | any, res: Response, next: NextFunction) => {
    // to check the validation and throw the reponse error
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const response = new ResponseModel(
        errors.array(),
        HttpStatusCodes.BAD_REQUEST,
        'Error while validating request body'
      );

      logger.info('Into Controller: Failed validating Request: Declined');

      return res.status(HttpStatusCodes.BAD_REQUEST).json(response.generate());
    }
    next();
  };
}

export default errorMiddleware;
