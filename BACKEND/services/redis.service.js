import Redis from "ioredis";

let redisClient = null;

export const getRedisClient = () => {
  if (!process.env.REDIS_HOST || !process.env.REDIS_PORT) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    });

    redisClient.on("connect", () => {
      console.log("redis connected");
    });

    redisClient.on("error", (err) => {
      console.error("Redis connection error:", err.message);
    });
  }

  return redisClient;
};
