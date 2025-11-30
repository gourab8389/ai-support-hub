import { Context, Next } from 'hono';
import Redis from 'ioredis';
import { env, config } from '@/config/env';
import { ApiError } from '@/utils/response';

const redis = new Redis(env.REDIS_URL);

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
}

export const rateLimit = (options: Partial<RateLimitOptions> = {}) => {
  const opts: RateLimitOptions = {
    windowMs: options.windowMs || config.rateLimit.windowMs,
    maxRequests: options.maxRequests || config.rateLimit.maxRequests,
    keyGenerator: options.keyGenerator || ((c: Context) => {
      return c.req.header('X-Forwarded-For') || 
             c.req.header('X-Real-IP') || 
             'unknown';
    }),
  };

  return async (c: Context, next: Next) => {
    const key = `ratelimit:${opts.keyGenerator!(c)}`;
    const now = Date.now();
    const windowStart = now - opts.windowMs;

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const requestCount = await redis.zcard(key);

      if (requestCount >= opts.maxRequests) {
        const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length > 0 
          ? parseInt(oldestRequest[1]) + opts.windowMs 
          : now + opts.windowMs;

        c.header('X-RateLimit-Limit', opts.maxRequests.toString());
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());

        throw new ApiError('Too many requests, please try again later', 429);
      }

      // Add current request
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(opts.windowMs / 1000));

      // Set headers
      c.header('X-RateLimit-Limit', opts.maxRequests.toString());
      c.header('X-RateLimit-Remaining', (opts.maxRequests - requestCount - 1).toString());

      await next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      // If Redis fails, allow the request
      await next();
    }
  };
};