import Redis from "ioredis";

export const dataRedis = new Redis(process.env.REDIS_URL as string)