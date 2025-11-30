import { cors } from 'hono/cors';
import { config } from '@/config/env';

export const corsMiddleware = cors({
  origin: [config.frontendUrl, config.appUrl],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  credentials: true,
});