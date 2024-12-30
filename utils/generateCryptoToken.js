import crypto from 'crypto';

export const generateCryptoToken = (bytes) =>  crypto.randomBytes(bytes).toString('hex');
