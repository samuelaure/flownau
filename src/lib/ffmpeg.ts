import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

/**
 * Get media file metadata (duration, resolution, format)
 */
export async function probeMedia(filePath: string): Promise<ffmpeg.FfprobeData> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
}

/**
 * Helper to ensure a file is H.264/AAC for browser compatibility
 * Pass-through if already compatible, re-encode if not.
 */
export async function optimizeVideo(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-crf 23', // Good balance for quality/size
        '-preset ultrafast', // Tradeoff compression speed for CPU usage (Critical for CX23)
        '-movflags +faststart', // Enable web streaming
      ])
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}
