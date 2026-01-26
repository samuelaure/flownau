import prisma from '@/lib/prisma';
import { renderQueue, publishQueue } from '@/lib/queue';
import { logger } from '@/lib/logger';

const SCHEDULER_INTERVAL = 60 * 1000; // Check every minute

/**
 * Lean Scheduler
 *
 * Replaces external Crons (GitHub Actions).
 * Runs inside the main Next.js process (or worker) to check for pending tasks.
 *
 * Logic:
 * 1. Find ACTIVE projects
 * 2. Check if a daily render is due (based on simple config for now, expanded later)
 * 3. Dispatch Render Jobs to the In-Memory Queue
 */
export function startScheduler() {
  logger.info('⏰ Scheduler started');

  // Initial check
  checkSchedule();

  // Loop
  setInterval(checkSchedule, SCHEDULER_INTERVAL);
}

async function checkSchedule() {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Simple logic: Run at 10:00 and 18:00 local time
    // In future: Use a 'Schedule' table for per-project configuration

    const isMorningRun = currentHour === 10 && currentMinute === 0;
    const isEveningRun = currentHour === 18 && currentMinute === 0;

    if (!isMorningRun && !isEveningRun) return;

    const templateId = isMorningRun ? 'asfa-t1' : 'asfa-t2';

    logger.info(
      { phase: isMorningRun ? 'Morning' : 'Evening' },
      'Triggering scheduled automation cycle'
    );

    // Fetch all active projects
    // In real impl, we'd filter by those enabled for automation
    const projects = await prisma.project.findMany({
      include: { user: true },
    });

    for (const project of projects) {
      logger.info({ projectId: project.id, templateId }, 'Queueing render');

      // Create Render Record
      const render = await prisma.render.create({
        data: {
          templateId,
          projectId: project.id,
          params: JSON.stringify({}), // Should be populated from Content Feed
          status: 'PENDING',
        },
      });

      // Dispatch to Queue
      await renderQueue.add('scheduled-render', { renderId: render.id });
    }
  } catch (error) {
    logger.error({ err: error }, 'Scheduler failed to run');
  }
}
