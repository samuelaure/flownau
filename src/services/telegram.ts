import axios from 'axios';
import { logger } from '@/lib/logger';

export async function notifyTelegram(message: string, chatId?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !targetChatId) {
    logger.debug('Telegram notification skipped: Bot token or Chat ID missing.');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: targetChatId,
      text: message,
      parse_mode: 'HTML',
    });
    logger.debug('Telegram notification sent.');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Telegram notification failed');
  }
}
