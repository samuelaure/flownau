import { Worker, Job } from "bullmq";
import { redisConnection } from "@/lib/queue";
import prisma from "@/lib/prisma";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { r2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const BUNDLE_PATH = path.join(process.cwd(), "src/remotion/index.ts");

export const renderWorker = new Worker(
    "render-queue",
    async (job: Job) => {
        const { renderId } = job.data;

        const render = await prisma.render.findUnique({
            where: { id: renderId },
            include: { project: { include: { workspace: true } } }
        });

        if (!render) throw new Error("Render not found");

        await prisma.render.update({
            where: { id: renderId },
            data: { status: "PROCESSING" }
        });

        const outputFilename = `render_${renderId}.mp4`;
        const outputPath = path.join(os.tmpdir(), outputFilename);

        try {
            console.log(`🚀 Starting render for ${renderId}...`);

            const bundled = await bundle(BUNDLE_PATH);
            const composition = await selectComposition({
                serveUrl: bundled,
                id: "Main", // Adjust based on your Root.tsx
                inputProps: render.params as any,
            });

            await renderMedia({
                composition,
                serveUrl: bundled,
                codec: "h264",
                outputLocation: outputPath,
                inputProps: render.params as any,
            });

            console.log(`✅ Render finished. Uploading to R2...`);

            const r2Key = `${render.project.workspaceId}/${render.projectId}/renders/${outputFilename}`;
            const fileBuffer = await fs.readFile(outputPath);

            await r2Client.send(
                new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME!,
                    Key: r2Key,
                    Body: fileBuffer,
                    ContentType: "video/mp4",
                })
            );

            await prisma.render.update({
                where: { id: renderId },
                data: {
                    status: "COMPLETED",
                    outputR2Key: r2Key,
                    outputUrl: `${process.env.R2_PUBLIC_URL}/${r2Key}`
                }
            });

            // Cleanup
            await fs.unlink(outputPath);

            return { success: true, r2Key };
        } catch (error: any) {
            console.error(`❌ Render failed:`, error);
            await prisma.render.update({
                where: { id: renderId },
                data: { status: "FAILED" }
            });
            throw error;
        }
    },
    { connection: redisConnection }
);
