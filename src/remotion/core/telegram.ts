import axios from "axios";
import { env } from "./config.js";
import logger from "./logger.js";

export async function notifyTelegram(message) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    logger.debug(
      "Telegram notification skipped: Bot token or Chat ID not provided.",
    );
    return;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML",
      },
    );
    logger.debug("Telegram notification sent.");
  } catch (err) {
    logger.error({ err: err.message }, "Telegram notification failed");
  }
}
