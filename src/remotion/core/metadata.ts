import { exec } from "child_process";
import { promisify } from "util";
import logger from "./logger.js";

const execAsync = promisify(exec);

/**
 * Fetches the duration of a video (local or remote) using remotion's ffprobe.
 * This is more stable than the compositor-based getVideoMetadata on some environments.
 * @param {string} source Path or URL
 * @returns {Promise<number>} Duration in frames (at 30fps)
 */
export async function getVideoDuration(source) {
  try {
    // ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 [source]
    const { stdout } = await execAsync(
      `npx remotion ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${source}"`,
    );

    const durationInSeconds = parseFloat(stdout.trim());
    if (isNaN(durationInSeconds)) {
      throw new Error("ffprobe returned invalid duration");
    }

    return Math.floor(durationInSeconds * 30);
  } catch (error) {
    logger.warn(
      { source, err: error.message },
      "Failed to fetch duration via ffprobe. Using 15s fallback.",
    );
    // Return 15s (450 frames) as a safe fallback to ensure looping works
    return 450;
  }
}
