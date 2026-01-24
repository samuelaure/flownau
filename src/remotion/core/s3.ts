import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { env } from "./config.js";
import logger from "./logger.js";

const s3Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Uploads a file to Cloudflare R2
 * @param {string} localFilePath - Path to the local file
 * @param {string} [remoteFileName] - Optional custom name for the remote file
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadToR2 = async (localFilePath, remoteFileName = null) => {
  const fileName = remoteFileName || path.basename(localFilePath);
  const fileStream = fs.createReadStream(localFilePath);
  const fileStats = fs.statSync(localFilePath);

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: fileName,
    Body: fileStream,
    ContentLength: fileStats.size,
    ContentType: "video/mp4", // Assuming mp4 for our reels
  });

  try {
    logger.info(
      { bucket: env.R2_BUCKET_NAME, key: fileName },
      "Uploading file to R2...",
    );
    await s3Client.send(command);

    // Construct the public URL
    // Ensure public URL has a trailing slash or handle joining properly
    const baseUrl = env.R2_PUBLIC_URL.endsWith("/")
      ? env.R2_PUBLIC_URL
      : `${env.R2_PUBLIC_URL}/`;

    const publicUrl = `${baseUrl}${fileName}`;
    logger.info({ publicUrl }, "File uploaded successfully to R2");
    return publicUrl;
  } catch (error) {
    logger.error({ err: error }, "Failed to upload file to R2");
    throw error;
  }
};
