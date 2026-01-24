import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import {
  fetchApprovedRecord,
  updateRecordToProcessed,
} from "./core/airtable.js";
import { uploadToR2 } from "./core/s3.js";
import { publishToInstagram } from "./core/instagram.js";
import { notifyTelegram } from "./core/telegram.js";
import { calculateTotalFrames } from "./core/timing.js";
import { getVideoDuration } from "./core/metadata.js";
import { env } from "./core/config.js";
import logger from "./core/logger.js";

const run = async () => {
  // 0. Configuration Mapping
  const templateArg = (process.argv[2] || "asfa-t1").replace(/^--/, "");
  const configs = {
    "asfa-t1": {
      id: "asfa-t1",
      tableId: env.AIRTABLE_ASFA_T1_TABLE_ID,
    },
    "asfa-t2": {
      id: "asfa-t2",
      tableId: env.AIRTABLE_ASFA_T2_TABLE_ID,
    },
  };

  const activeConfig = configs[templateArg];

  if (!activeConfig) {
    logger.error({ templateArg }, "Invalid template ID provided.");
    process.exit(1);
  }

  const entry = path.resolve("src/index.js");
  const outputLocation = path.resolve("out/video.mp4");

  logger.info(
    { templateId: activeConfig.id },
    "🚀 Astromatic: Starting automation cycle...",
  );

  try {
    // 1. Fetch Approved Content from Airtable
    const payload = await fetchApprovedRecord(
      activeConfig.id,
      activeConfig.tableId,
    );

    if (!payload) {
      logger.info(
        { templateId: activeConfig.id },
        "Nothing to process. Exiting.",
      );
      await notifyTelegram(
        `⚠️ <b>Astromatic:</b> No approved records found in Airtable for <b>${activeConfig.id}</b> today.`,
      );
      return;
    }

    // Ensure output directory exists and old file is removed
    if (fs.existsSync(outputLocation)) {
      try {
        fs.unlinkSync(outputLocation);
      } catch (e) {
        throw new Error(
          `Could not delete ${outputLocation}. Please close any program (like VLC or Windows Media Player) that is using it.`,
        );
      }
    }

    // 2. Random Background & Music Selection
    const selectRandom = (max) => Math.floor(Math.random() * max) + 1;
    const videoIndex1 = selectRandom(28);
    let videoIndex2 = selectRandom(28);
    while (videoIndex2 === videoIndex1) videoIndex2 = selectRandom(28);
    const musicIndex = selectRandom(10);

    const pad = (n) => String(n).padStart(4, "0");
    const vid1Name = `ASFA_VID_${pad(videoIndex1)}`;
    const vid2Name = `ASFA_VID_${pad(videoIndex2)}`;
    const audName = `ASFA_AUD_${pad(musicIndex)}`;

    const r2BaseUrl = env.R2_PUBLIC_URL.replace(/\/$/, "");
    const bg1Url = `${r2BaseUrl}/astrologia_familiar/videos/ASFA_VID_${pad(videoIndex1)}.mp4`;
    const bg2Url = `${r2BaseUrl}/astrologia_familiar/videos/ASFA_VID_${pad(videoIndex2)}.mp4`;

    logger.info("Fetching video metadata for smart looping...");
    const [video1Duration, video2Duration] = await Promise.all([
      getVideoDuration(bg1Url),
      getVideoDuration(bg2Url),
    ]);

    logger.info(
      { video1Duration, video2Duration },
      "Metadata fetched using ffprobe",
    );

    // 3. Prepare Composition
    logger.info("Bundling and selecting composition...");
    const bundled = await bundle(entry);

    // Calculate dynamic duration based on text content
    const durationInFrames = calculateTotalFrames(payload.sequences);
    logger.info({ durationInFrames }, "Calculated composition duration");

    // Construct common input props
    const inputProps = {
      ...payload,
      templateId: activeConfig.id,
      videoIndex1,
      videoIndex2,
      video1Duration,
      video2Duration,
      musicIndex,
      durationInFrames,
      r2BaseUrl,
    };

    const composition = await selectComposition({
      serveUrl: bundled,
      id: "Main",
      inputProps,
    });

    // Override hardcoded composition duration with dynamic calculation
    composition.durationInFrames = durationInFrames;

    // 4. Render
    logger.info(`Rendering video (${durationInFrames} frames)...`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      outputLocation,
      inputProps,
      codec: "h264",
      audioCodec: "aac",
    });
    logger.info("Render complete.");

    // 5. Distribution (Cloudflare R2)
    logger.info("Uploading to Cloudflare R2...");
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-T:]/g, "")
      .split(".")[0]
      .replace(/(\d{8})(\d{6})/, "$1_$2");
    const remoteKey = `astrologia_familiar/outputs/ASFA_OUTPUT_${timestamp}.mp4`;

    const publicUrl = await uploadToR2(outputLocation, remoteKey);
    logger.info({ publicUrl }, "File uploaded to R2");

    logger.info("Publishing to Instagram...");
    const postLink = await publishToInstagram(publicUrl, payload.caption);
    logger.info({ postLink }, "Published to Instagram successfully.");

    // 6. Update Status in Airtable
    await updateRecordToProcessed(payload.id, activeConfig.tableId);

    await notifyTelegram(
      `✅ <b>Astromatic:</b> Cycle completed for <b>${activeConfig.id}</b>!\n\n🎬 <b>Assets:</b>\n- Video 1: <code>${vid1Name}</code>\n- Video 2: <code>${vid2Name}</code>\n- Music: <code>${audName}</code>\n\n🔗 <a href="${postLink}">View on Instagram</a>`,
    );
    logger.info("✅ Automation cycle finished.");
  } catch (error) {
    logger.error({ err: error }, "Critical failure in automation pipeline");
    await notifyTelegram(`❌ <b>Astromatic Error:</b>\n${error.message}`);
    process.exit(1);
  }
};

run();
