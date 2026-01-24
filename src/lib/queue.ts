import { Queue, ConnectionOptions } from "bullmq";
import IORedis from "ioredis";

const connection: ConnectionOptions = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};

export const redisConnection = new IORedis(connection);

export const renderQueue = new Queue("render-queue", {
    connection: redisConnection
});

export const publishQueue = new Queue("publish-queue", {
    connection: redisConnection
});
