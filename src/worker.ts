import { workerLogger } from '@/lib/logger';
import { renderWorker } from './workers/render-worker';
import { publishWorker } from './workers/publish-worker';
import { automationWorker } from './workers/automation-worker';
import { Job } from 'bullmq';

workerLogger.info('🛠️  Flownaŭ Background Worker started...');

renderWorker.on('completed', (job: Job) => {
  workerLogger.info({ jobId: job.id }, 'Render job completed');
});

renderWorker.on('failed', (job: Job | undefined, err: Error) => {
  workerLogger.error({ jobId: job?.id, err }, 'Render job failed');
});

automationWorker.on('completed', (job: Job) => {
  workerLogger.info({ jobId: job.id }, 'Automation cycle job completed');
});

automationWorker.on('failed', (job: Job | undefined, err: Error) => {
  workerLogger.error({ jobId: job?.id, err }, 'Automation cycle job failed');
});
