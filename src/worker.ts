import { renderWorker } from "./workers/render-worker";
import { publishWorker } from "./workers/publish-worker";

console.log("🛠️  Flownaŭ Background Worker started...");

renderWorker.on("completed", (job) => {
    console.log(`✅ Render job ${job.id} completed`);
});

renderWorker.on("failed", (job, err: Error) => {
    console.log(`❌ Render job ${job?.id} failed: ${err.message}`);
});

publishWorker.on("completed", (job) => {
    console.log(`✅ Publish job ${job.id} completed`);
});

publishWorker.on("failed", (job, err: Error) => {
    console.log(`❌ Publish job ${job?.id} failed: ${err.message}`);
});
