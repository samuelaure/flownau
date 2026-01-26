import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue';
import prisma from '@/lib/prisma';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

import { workerLogger } from '@/lib/logger';

const BUNDLE_PATH = path.join(process.cwd(), 'src/remotion/index.ts');

export const renderWorker = new Worker(
  'render-queue',
  async (job: Job) => {
    const { renderId } = job.data;
    const log = workerLogger.child({ renderId, jobId: job.id });

    try {
      const render = await prisma.render.findUnique({
        where: { id: renderId },
        include: { project: { include: { user: true } } },
      });

      if (!render) {
        log.error('Render entity not found in database');
        throw new Error('Render not found');
      }

      await prisma.render.update({
        where: { id: renderId },
        data: { status: 'PROCESSING' },
      });

      log.info('Starting video render');

      const outputFilename = `render_${renderId}.mp4`;
      const outputPath = path.join(os.tmpdir(), outputFilename);

      let serveUrl: string;

      if (process.env.NODE_ENV === 'production') {
        serveUrl = path.join(process.cwd(), 'out');
      } else {
        serveUrl = await bundle(BUNDLE_PATH);
      }

      const composition = await selectComposition({
        serveUrl,
        id: 'Main',
        inputProps: render.params as any,
      });

      await renderMedia({
        composition,
        serveUrl,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: render.params as any,
      });

      log.info('Render finished locally, uploading to R2');

      const r2Key = `${render.project.userId}/${render.projectId}/renders/${outputFilename}`;
      const fileBuffer = await fs.readFile(outputPath);

      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: r2Key,
          Body: fileBuffer,
          ContentType: 'video/mp4',
        })
      );

      await prisma.render.update({
        where: { id: renderId },
        data: {
          status: 'COMPLETED',
          outputR2Key: r2Key,
          outputUrl: `${process.env.R2_PUBLIC_URL}/${r2Key}`,
        },
      });

      await fs.unlink(outputPath);
      log.info({ r2Key }, 'Render fully completed and uploaded');

      return { success: true, r2Key };
    } catch (error: any) {
      log.error({ err: error }, 'Render job failed');

      await prisma.render.update({
        where: { id: renderId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  },
  { connection: redisConnection }
);
