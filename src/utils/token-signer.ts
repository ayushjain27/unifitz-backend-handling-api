import jwt from 'jsonwebtoken';
import config from 'config';
import { createHash } from 'crypto';

export const generateToken = async (
  claims: Record<string, unknown>,
  signingOptions: Record<string, unknown> = {
    expiresIn: config.get('JWT_EXPIRATION')
  }
): Promise<string> => {
  return jwt.sign(
    {
      ...claims,
      ...{ iss: createHash('sha256').update(config.get('ISS')).digest('hex') }
    },
    config.get('JWT_SECRET'),
    signingOptions
  );
};
