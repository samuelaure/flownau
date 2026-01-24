import { S3Client } from '@aws-sdk/client-s3';
import { config } from './config';

let client: S3Client | null = null;

export function getS3Client() {
  if (client) return client;

  client = new S3Client({
    region: 'auto',
    endpoint: config.r2.endpoint,
    credentials: {
      accessKeyId: config.r2.accessKeyId as string,
      secretAccessKey: config.r2.secretAccessKey as string,
    },
  });

  return client;
}
