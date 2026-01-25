import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'HH:MM:ss Z',
        },
      },
  base: {
    env: process.env.NODE_ENV,
  },
});

export const workerLogger = logger.child({ component: 'worker' });
export const apiLogger = logger.child({ component: 'api' });
export const r2Logger = logger.child({ component: 'r2' });
