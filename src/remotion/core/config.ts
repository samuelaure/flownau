import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // Cloudflare R2 (S3 Compatible)
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_ENDPOINT: z.string().url(),
  R2_BUCKET_NAME: z.string(),
  R2_PUBLIC_URL: z.string().url(),

  // FTP (Optional now, but keeping for backward compatibility)
  FTP_HOST: z.string().optional(),
  FTP_USER: z.string().optional(),
  FTP_PASSWORD: z.string().optional(),
  FTP_REMOTE_PATH: z.string().default("public_html/ig/astrologia_familiar"),
  PUBLIC_VIDEO_BASE_URL: z.string().url().optional(),

  // Airtable
  AIRTABLE_TOKEN: z.string(),
  AIRTABLE_BASE_ID: z
    .preprocess((val) => (val === "" ? undefined : val), z.string())
    .default("appEVPrTtF1XyAQ4h"),
  AIRTABLE_ASFA_T1_TABLE_ID: z
    .preprocess((val) => (val === "" ? undefined : val), z.string())
    .default("tblC7lVTkY0ftzNoS"),
  AIRTABLE_ASFA_T2_TABLE_ID: z
    .preprocess((val) => (val === "" ? undefined : val), z.string())
    .default("tblkTYpwfm3aLzKER"),

  // Instagram
  IG_TOKEN: z.string(),
  IG_USER_ID: z.string(),

  // Telegram (Optional)
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Environment
  NODE_ENV: z
    .preprocess(
      (val) => (val === "" ? undefined : val),
      z.enum(["development", "production", "test"]),
    )
    .default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
