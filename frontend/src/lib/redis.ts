import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379/0';

// Global singleton for Redis instance to prevent multiple connections in dev
declare global {
  var redis: Redis | undefined;
}

export const redis = global.redis || new Redis(redisUrl, { lazyConnect: true });

if (process.env.NODE_ENV !== 'production') global.redis = redis;
