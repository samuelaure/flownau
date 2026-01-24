import { Worker, Job } from "bullmq";
import { redisConnection } from "@/lib/queue";
import prisma from "@/lib/prisma";
import { publishToInstagram } from "@/remotion/core/instagram";
import { getSocialToken } from "@/actions/social";

export const publishWorker = new Worker(
    "publish-queue",
    async (job: Job) => {
        const { renderId, socialAccountId, caption } = job.data;

        const render = await prisma.render.findUnique({
            where: { id: renderId },
        });

        if (!render || !render.outputUrl) {
            throw new Error("Render output not found or not ready");
        }

        const account = await prisma.socialAccount.findUnique({
            where: { id: socialAccountId }
        });

        if (!account) throw new Error("Social account not found");

        // Decrypt the token for usage
        const accessToken = await getSocialToken(socialAccountId);

        console.log(`📸 Publishing to Instagram (${account.profileName})...`);

        try {
            // Note: We need to ensure remotion/core/instagram uses the provided token 
            // instead of reading from process.env directly. 
            // I'll need to refactor the IG utility slightly.

            const permalink = await publishToInstagram(
                render.outputUrl,
                caption,
                accessToken,
                account.platformId
            );

            console.log(`✅ Published! URL: ${permalink}`);

            return { success: true, permalink };
        } catch (error) {
            console.error(`❌ Publishing failed:`, error);
            throw error;
        }
    },
    { connection: redisConnection }
);
