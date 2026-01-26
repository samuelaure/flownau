import prisma from '@/lib/prisma';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { probeMedia } from '@/lib/ffmpeg';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { r2Logger } from '@/lib/logger';

const VIDEO_EXTENSIONS = /\.(mp4|mov|avi|mkv)$/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg)$/i;

export type IngestResult = {
  success: boolean;
  asset?: any;
  error?: string;
  deduplicated?: boolean;
};

export class IngestionService {
  /**
   * Processing pipeline:
   * 1. Save buffer to temp file
   * 2. Hash content (SHA-256)
   * 3. Probing (FFmpeg) for metadata
   * 4. Upload to R2 (Standardized Path)
   * 5. Register in DB
   */
  static async processBuffer(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    projectId: string
  ): Promise<IngestResult> {
    const tempPath = path.join(
      os.tmpdir(),
      `upload_${crypto.randomBytes(8).toString('hex')}_${originalName}`
    );

    try {
      await fs.writeFile(tempPath, buffer);

      // 1. Hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      // 2. Deduplication Check
      const existing = await prisma.asset.findUnique({
        where: { projectId_hash: { projectId, hash } },
      });

      if (existing) {
        return { success: true, asset: existing, deduplicated: true };
      }

      // 3. Metadata Extraction
      let durationSeconds: number | undefined;
      const isVideo = VIDEO_EXTENSIONS.test(originalName);
      const isAudio = AUDIO_EXTENSIONS.test(originalName);

      if (isVideo || isAudio) {
        try {
          const metadata = await probeMedia(tempPath);
          durationSeconds = metadata.format.duration;
        } catch (e) {
          r2Logger.warn({ file: originalName }, 'Failed to probe media metadata');
        }
      }

      // 4. R2 Upload
      const extension = originalName.split('.').pop() || '';
      const typeCategory = isVideo ? 'videos' : isAudio ? 'audios' : 'images';
      const r2Key = `${projectId}/${typeCategory}/${hash}.${extension}`;

      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: r2Key,
          Body: buffer,
          ContentType: mimeType,
        })
      );

      // 5. Database Record
      const assetType = isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : 'IMAGE';
      const asset = await prisma.asset.create({
        data: {
          type: assetType,
          systemFilename: `${hash}.${extension}`,
          originalFilename: originalName,
          hash,
          r2Key,
          r2Url: `${process.env.R2_PUBLIC_URL}/${r2Key}`,
          sizeBytes: BigInt(buffer.length),
          mimeType,
          durationSeconds,
          projectId,
          status: 'ACTIVE',
        },
      });

      return { success: true, asset };
    } catch (error: any) {
      r2Logger.error({ err: error, file: originalName }, 'Ingestion failed');
      return { success: false, error: error.message };
    } finally {
      try {
        await fs.unlink(tempPath);
      } catch (e) {
        /* ignore */
      }
    }
  }
}
