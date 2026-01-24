import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { fetchApprovedRecord } from "./core/airtable.js";
import { calculateTotalFrames } from "./core/timing.js";
import { getVideoDuration } from "./core/metadata.js";
import { env } from "./core/config.js";
import logger from "./core/logger.js";

const runDev = async () => {
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
  const outputLocation = path.resolve("out/test-video.mp4");

  logger.info(
    { templateId: activeConfig.id },
    "🧪 [DEV MODE] Starting pipeline test (Render only)...",
  );

  try {
    // 0. Ensure old file is removed
    if (fs.existsSync(outputLocation)) {
      try {
        fs.unlinkSync(outputLocation);
      } catch (e) {
        throw new Error(
          `Could not delete ${outputLocation}. Please close any program (like VLC or Windows Media Player) that is using it.`,
        );
      }
    }

    // 1. Fetch Approved Content from Airtable
    const payload = await fetchApprovedRecord(
      activeConfig.id,
      activeConfig.tableId,
    );

    if (!payload) {
      logger.info(
        { templateId: activeConfig.id },
        "No 'Approved' record found in Airtable to test with.",
      );
      return;
    }

    logger.info({ recordId: payload.id }, "Testing with Airtable record...");

    // 2. Asset Selection (Indices)
    const selectRandom = (max) => Math.floor(Math.random() * max) + 1;
    const videoIndex1 = selectRandom(28);
    let videoIndex2 = selectRandom(28);
    while (videoIndex2 === videoIndex1) videoIndex2 = selectRandom(28);
    const musicIndex = selectRandom(10);

    const r2BaseUrl = env.R2_PUBLIC_URL?.replace(/\/$/, "");
    const pad = (n) => String(n).padStart(4, "0");

    const getAssetSource = (index) => {
      if (r2BaseUrl) {
        return `${r2BaseUrl}/astrologia_familiar/videos/ASFA_VID_${pad(index)}.mp4`;
      }
      return path.resolve(
        `public/background_videos/astro-background-video-${index}.mp4`,
      );
    };

    const bg1Source = getAssetSource(videoIndex1);
    const bg2Source = getAssetSource(videoIndex2);

    logger.info("Fetching video metadata for smart looping...");
    const [video1Duration, video2Duration] = await Promise.all([
      getVideoDuration(bg1Source),
      getVideoDuration(bg2Source),
    ]);

    logger.info(
      { video1Duration, video2Duration },
      "Metadata fetched using ffprobe",
    );

    // 3. Prepare Composition
    logger.info("Bundling and selecting composition...");
    const bundled = await bundle(entry);

    // Calculate dynamic duration
    const durationInFrames = calculateTotalFrames(payload.sequences);
    logger.info({ durationInFrames }, "Calculated duration");

    const inputProps = {
      ...payload,
      templateId: activeConfig.id,
      videoIndex1,
      videoIndex2,
      video1Duration,
      video2Duration,
      musicIndex,
      durationInFrames,
      r2BaseUrl: r2BaseUrl || "",
    };

    const composition = await selectComposition({
      serveUrl: bundled,
      id: "Main",
      inputProps,
    });

    // Override hardcoded composition duration with dynamic calculation
    composition.durationInFrames = durationInFrames;

    // 4. Render Locally
    logger.info(`Rendering test video to ${outputLocation}...`);
    await renderMedia({
      composition,
      serveUrl: bundled,
      outputLocation,
      inputProps,
      codec: "h264",
      audioCodec: "aac",
    });

    logger.info("✅ Render complete! Check out/test-video.mp4");
    logger.info(
      "ℹ️ Distribution and Airtable updates were skipped in DEV MODE.",
    );
  } catch (error) {
    logger.error({ err: error }, "Test render failed");
    process.exit(1);
  }
};

runDev();
