import { Request, Response, NextFunction } from 'express';
import { smcInsuranceKey } from '../config/constants';

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers['x-api-key']; // Replace 'x-api-key' with the header key name you expect
  const validApiKey = smcInsuranceKey; // Store the valid key securely in an environment variable

  if (!apiKey || apiKey !== validApiKey) {
    res
      .status(401)
      .json({ message: 'Unauthorized: Invalid or missing API key' });
  }

  next(); // Proceed to the next middleware or controller
};
