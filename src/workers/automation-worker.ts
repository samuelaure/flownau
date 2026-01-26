import { Worker, Job } from 'bullmq';
import { redisConnection } from '@/lib/queue';
import { AutomationEngine } from '@/services/automation-engine';
import { workerLogger } from '@/lib/logger';

export const automationWorker = new Worker(
  'automation-queue',
  async (job: Job) => {
    const { projectId } = job.data;
    const log = workerLogger.child({ projectId, jobId: job.id });

    try {
      log.info('Starting automation job');
      const result = await AutomationEngine.runCycle(projectId);
      return result;
    } catch (error: any) {
      log.error({ err: error.message }, 'Automation job failed');
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 1 }
);
