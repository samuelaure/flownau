import { Worker, Job } from "bullmq";
import { redisConnection } from "@/lib/queue";
import prisma from "@/lib/prisma";
import { publishToInstagram } from "@/remotion/core/instagram";
import { getSocialToken } from "@/actions/social";

import { workerLogger } from "@/lib/logger";

export const publishWorker = new Worker(
    "publish-queue",
    async (job: Job) => {
        const { renderId, socialAccountId, caption } = job.data;
        const log = workerLogger.child({ renderId, socialAccountId, jobId: job.id });

        try {
            const render = await prisma.render.findUnique({
                where: { id: renderId },
            });

            if (!render || !render.outputUrl) {
                log.error("Render output not found or not ready for publishing");
                throw new Error("Render output not found or not ready");
            }

            const account = await prisma.socialAccount.findUnique({
                where: { id: socialAccountId }
            });

            if (!account) {
                log.error("Social account not found for publishing");
                throw new Error("Social account not found");
            }

            // Decrypt the token for usage
            const accessToken = await getSocialToken(socialAccountId);

            log.info({ profileName: account.profileName }, "Publishing to Instagram");

            const permalink = await publishToInstagram(
                render.outputUrl,
                caption,
                accessToken,
                account.platformId
            );

            log.info({ permalink }, "Content published successfully to Instagram");

            return { success: true, permalink };
        } catch (error) {
            log.error({ err: error }, "Publishing job failed");
            throw error;
        }
    },
    { connection: redisConnection }
);
