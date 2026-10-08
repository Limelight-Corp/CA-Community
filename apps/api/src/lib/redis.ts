import Redis from 'ioredis';
import { env } from '../config/env';

export interface ICacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class InMemoryCacheStore implements ICacheStore {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}

class RedisCacheStore implements ICacheStore {
  constructor(private client: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}

export function createCacheClient(): { store: ICacheStore; redis?: Redis } {
  try {
    const redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't loop endlessly if redis is down
      lazyConnect: true,
    });

    redis.on('error', () => {
      // Gracefully silent in dev if redis server is not running
    });

    return { store: new RedisCacheStore(redis), redis };
  } catch (_e) {
    console.warn('⚠️ Redis connection unavailable, falling back to In-Memory cache store');
    return { store: new InMemoryCacheStore() };
  }
}
