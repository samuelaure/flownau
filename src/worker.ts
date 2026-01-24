import { workerLogger } from "@/lib/logger";
import { renderWorker } from "./workers/render-worker";
import { publishWorker } from "./workers/publish-worker";
import { Job } from "bullmq";

workerLogger.info("🛠️  Flownaŭ Background Worker started...");

renderWorker.on("completed", (job: Job) => {
    workerLogger.info({ jobId: job.id }, "Render job completed");
});

renderWorker.on("failed", (job: Job | undefined, err: Error) => {
    workerLogger.error({ jobId: job?.id, err }, "Render job failed");
});

publishWorker.on("completed", (job: Job) => {
    workerLogger.info({ jobId: job.id }, "Publish job completed");
});

publishWorker.on("failed", (job: Job | undefined, err: Error) => {
    workerLogger.error({ jobId: job?.id, err }, "Publish job failed");
});

