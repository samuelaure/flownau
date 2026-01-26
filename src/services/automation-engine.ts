import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fetchApprovedRecord, updateRecordToProcessed } from './airtable';
import { publishToInstagram } from './instagram';
import { notifyTelegram } from './telegram';
import { calculateTotalFrames } from '@/lib/timing';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import os from 'os';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { r2Client } from '@/lib/r2';
import { probeMedia } from '@/lib/ffmpeg';

export class AutomationEngine {
  static async runCycle(projectId: string) {
    const project = (await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        socialAccounts: {
          where: { platform: 'INSTAGRAM' },
        },
      },
    })) as any;

    if (!project) throw new Error('Project not found');
    const igAccount = project.socialAccounts[0];

    const log = logger.child({ project: project.shortCode, projectId });
    log.info('Starting automation cycle');

    try {
      // 1. Fetch from Airtable
      const airtableToken = project.airtableToken || process.env.AIRTABLE_TOKEN!;
      const payload = await fetchApprovedRecord(
        project.airtableBaseId!,
        project.airtableTableId!,
        airtableToken,
        project.activeTemplateId
      );

      if (!payload) {
        log.info('Nothing to process in Airtable');
        await notifyTelegram(`⚠️ <b>${project.name}:</b> No approved records found in Airtable.`);
        return { success: true, reason: 'No records' };
      }

      // 2. Asset Selection (Random backgrounds and music)
      // Logic from astromatic: select random indices based on counters
      const selectRandom = (max: number) => Math.floor(Math.random() * max) + 1;
      const v1Idx = selectRandom(project.videoCounter || 28);
      let v2Idx = selectRandom(project.videoCounter || 28);
      while (v2Idx === v1Idx) v2Idx = selectRandom(project.videoCounter || 28);
      const mIdx = selectRandom(project.audioCounter || 10);

      const pad = (n: number) => String(n).padStart(4, '0');
      const r2BaseUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');

      const bg1Url = `${r2BaseUrl}/${project.shortCode.toLowerCase()}/videos/${project.shortCode}_VID_${pad(v1Idx)}.mp4`;
      const bg2Url = `${r2BaseUrl}/${project.shortCode.toLowerCase()}/videos/${project.shortCode}_VID_${pad(v2Idx)}.mp4`;

      // 3. Metadata fetching (Smart Looping)
      // We probe the remote URLs (Hetzner network to R2 should be fast)
      const [v1Meta, v2Meta] = await Promise.all([probeMedia(bg1Url), probeMedia(bg2Url)]);

      const durationInFrames = calculateTotalFrames(payload.sequences);

      const inputProps = {
        ...payload,
        templateId: project.activeTemplateId,
        videoIndex1: v1Idx,
        videoIndex2: v2Idx,
        video1Duration: v1Meta.format.duration,
        video2Duration: v2Meta.format.duration,
        musicIndex: mIdx,
        durationInFrames,
        r2BaseUrl,
      };

      // 4. Render
      log.info('Bundling and rendering...');
      const entry = path.join(process.cwd(), 'src/remotion/index.ts');

      let serveUrl: string;
      if (process.env.NODE_ENV === 'production') {
        serveUrl = path.join(process.cwd(), 'out');
      } else {
        serveUrl = await bundle(entry);
      }

      const composition = await selectComposition({
        serveUrl,
        id: 'Main',
        inputProps: inputProps as any,
      });

      // Override duration
      composition.durationInFrames = durationInFrames;

      const outputFilename = `${project.shortCode}_OUTPUT_${Date.now()}.mp4`;
      const outputPath = path.join(os.tmpdir(), outputFilename);

      await renderMedia({
        composition,
        serveUrl,
        outputLocation: outputPath,
        inputProps: inputProps as any,
        codec: 'h264',
        audioCodec: 'aac',
      });

      // 5. Upload Output to R2
      log.info('Uploading result to R2...');
      const r2Key = `${project.userId}/${project.id}/outputs/${outputFilename}`;
      const fileStream = fs.createReadStream(outputPath);

      const { Upload } = await import('@aws-sdk/lib-storage');
      const upload = new Upload({
        client: r2Client,
        params: {
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: r2Key,
          Body: fileStream,
          ContentType: 'video/mp4',
        },
      });

      await upload.done();
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${r2Key}`;

      // 6. Post to Instagram
      if (igAccount?.accessToken && igAccount?.platformId) {
        log.info('Publishing to Instagram...');
        const postLink = await publishToInstagram(
          publicUrl,
          payload.caption,
          igAccount.platformId,
          igAccount.accessToken
        );
        log.info({ postLink }, 'Instagram post successful');

        await notifyTelegram(
          `✅ <b>${project.name}:</b> Cycle completed!\n\n🔗 <a href="${postLink}">View on Instagram</a>`
        );
      } else {
        log.warn('Instagram access token or user ID missing, skipping post');
        await notifyTelegram(
          `✅ <b>${project.name}:</b> Render finished, but Instagram post skipped (no token).`
        );
      }

      // 7. Update status
      await updateRecordToProcessed(
        project.airtableBaseId!,
        project.airtableTableId!,
        airtableToken,
        payload.id
      );

      // Clean up
      await fsPromises.unlink(outputPath);

      return { success: true, url: publicUrl };
    } catch (error: any) {
      log.error({ err: error.message }, 'Cycle failure');
      await notifyTelegram(`❌ <b>${project.name} Error:</b>\n${error.message}`);
      throw error;
    }
  }
}
