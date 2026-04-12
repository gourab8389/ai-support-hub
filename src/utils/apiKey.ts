import { createHash } from 'crypto';
import { nanoid } from 'nanoid';

export const hashApiKey = (rawKey: string): string => {
  return createHash('sha256').update(rawKey).digest('hex');
};

export const generateRawApiKey = (): string => {
  return `sk_${nanoid(32)}`;
};
