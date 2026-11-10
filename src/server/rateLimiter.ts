import { Request, Response, NextFunction } from 'express';

interface RateLimitBucket {
  count: number;
  resetTime: number;
}

const memoryStore = new Map<string, RateLimitBucket>();

export interface RateLimiterOptions {
  windowSeconds?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export function rateLimiter(options: RateLimiterOptions = {}) {
  const windowSeconds = options.windowSeconds || 60;
  const maxRequests = options.maxRequests || 10;
  const keyPrefix = options.keyPrefix || 'rl';

  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const key = `${keyPrefix}:${rawIp}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let bucket = memoryStore.get(key);

    if (!bucket || now > bucket.resetTime) {
      bucket = {
        count: 1,
        resetTime: now + windowSeconds * 1000,
      };
      memoryStore.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, maxRequests - bucket.count);
    const retryAfter = Math.ceil((bucket.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(bucket.resetTime / 1000));

    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Too many requests from this IP. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      });
    }

    next();
  };
}

export function isRateLimiterHealthy(): boolean {
  return true;
}
