import PromiseFtp from "promise-ftp";
import fs from "fs";
import { env } from "./config.js";
import logger from "./logger.js";

export async function uploadToFtp(localPath) {
  const ftp = new PromiseFtp();
  const fileName = `video-${Date.now()}.mp4`;

  logger.debug(
    { host: env.FTP_HOST, user: env.FTP_USER, remotePath: env.FTP_REMOTE_PATH },
    "Connecting to FTP and preparing remote directory...",
  );

  try {
    await ftp.connect({
      host: env.FTP_HOST,
      user: env.FTP_USER,
      password: env.FTP_PASSWORD,
    });

    // Ensure remote directory exists
    const folders = env.FTP_REMOTE_PATH.split("/").filter((f) => f);
    for (const folder of folders) {
      try {
        await ftp.cwd(folder);
      } catch (err) {
        // Folder likely doesn't exist, try to create it
        await ftp.mkdir(folder);
        await ftp.cwd(folder);
      }
    }

    const stream = fs.createReadStream(localPath);
    await ftp.put(stream, fileName);
    await ftp.end();

    const publicUrl = `${env.PUBLIC_VIDEO_BASE_URL}/${fileName}`;
    return publicUrl;
  } catch (err) {
    logger.error({ err }, "FTP upload failed");
    if (ftp.getConnectionStatus() !== "disconnected") {
      await ftp.end();
    }
    throw err;
  }
}
