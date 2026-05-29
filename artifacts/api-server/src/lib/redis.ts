import { logger } from "./logger.js";

const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

const isRedisConfigured = Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);

if (!isRedisConfigured) {
  logger.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Using in-memory fallback — dispatch deduplication will not persist across restarts.");
}

const memoryStore = new Map<string, { value: string; expiresAt: number }>();

const memoryClient = {
  async get(key: string): Promise<string | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  async setex(key: string, seconds: number, value: string): Promise<void> {
    memoryStore.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
  },
  async del(key: string): Promise<void> {
    memoryStore.delete(key);
  },
};

type RedisClient = typeof memoryClient;

let redisClientInstance: RedisClient = memoryClient;

if (isRedisConfigured) {
  const { Redis } = await import("@upstash/redis");
  const upstash = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  redisClientInstance = {
    async get(key: string) {
      return upstash.get<string>(key);
    },
    async setex(key: string, seconds: number, value: string) {
      await upstash.setex(key, seconds, value);
    },
    async del(key: string) {
      await upstash.del(key);
    },
  };
}

export const redisClient = redisClientInstance;
export default redisClient;
