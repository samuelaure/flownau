import axios from "axios";
import { env } from "./config";
import logger from "./logger";

async function waitForMediaProcessing(containerId: string, token: string, maxRetries = 10) {
  for (let i = 0; i < maxRetries; i++) {
    logger.info(
      `Checking media processing status (attempt ${i + 1}/${maxRetries})...`,
    );
    const response = await axios.get(
      `https://graph.facebook.com/v24.0/${containerId}`,
      {
        params: {
          fields: "status_code,status",
          access_token: token,
        },
      },
    );

    const { status_code } = response.data;
    if (status_code === "FINISHED") {
      logger.info("Media processing finished.");
      return true;
    }

    if (status_code === "ERROR") {
      throw new Error(`Media processing failed: ${response.data.status}`);
    }

    // Wait 10 seconds before next poll
    await new Promise((res) => setTimeout(res, 10000));
  }
  throw new Error("Media processing timed out.");
}

export async function publishToInstagram(
  videoUrl: string,
  caption: string,
  targetToken?: string,
  targetUserId?: string
) {
  const token = targetToken || env.IG_TOKEN;
  const userId = targetUserId || env.IG_USER_ID;

  try {
    // 1. Create Media Container
    logger.info("Creating Instagram media container...");
    const container = await axios.post(
      `https://graph.facebook.com/v24.0/${userId}/media`,
      null,
      {
        params: {
          media_type: "REELS",
          video_url: videoUrl,
          caption: caption,
          access_token: token,
        },
      },
    );

    const creationId = container.data.id;
    logger.info({ creationId }, "Container created. Waiting for processing...");

    // 2. Wait for processing (Polling)
    await waitForMediaProcessing(creationId, token);

    // 3. Publish
    logger.info("Publishing media...");
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v24.0/${userId}/media_publish`,
      null,
      {
        params: {
          creation_id: creationId,
          access_token: token,
        },
      },
    );

    const publishId = publishResponse.data.id;
    logger.info({ publishId }, "Media published successfully.");

    // 4. Get Permalink
    const mediaResponse = await axios.get(
      `https://graph.facebook.com/v24.0/${publishId}`,
      {
        params: {
          fields: "permalink",
          access_token: token,
        },
      },
    );

    return mediaResponse.data.permalink;
  } catch (error: any) {
    const errorData = error.response?.data || error.message;
    logger.error({ err: errorData }, "Instagram publication failed");
    throw new Error(`Instagram Publish Error: ${JSON.stringify(errorData)}`);
  }
}
