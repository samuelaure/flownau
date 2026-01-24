import { Queue, ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

const connection: ConnectionOptions = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};

import { logger } from "./logger";

export const redisConnection = new IORedis(connection);

redisConnection.on("error", (error) => {
    logger.error({ err: error }, "Redis connection error");
});

redisConnection.on("connect", () => {
    logger.info("Connected to Redis");
});

export const renderQueue = new Queue("render-queue", {
    connection: redisConnection
});

export const publishQueue = new Queue("publish-queue", {
    connection: redisConnection
});
