'use server';

import { auth } from '@/auth';
import { automationQueue } from '@/lib/queue';
import { revalidatePath } from 'next/cache';
import { AuthenticationError, ValidationError } from '@/lib/exceptions';
import { handleActionError } from '@/lib/error-handler';
import prisma from '@/lib/prisma';

export async function triggerAutomationCycle(projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    // Verify ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId, userId: session.user.id },
    });

    if (!project) throw new ValidationError('Project not found or access denied');

    // Add to queue
    const job = await automationQueue.add(
      `automation-${projectId}-${Date.now()}`,
      { projectId },
      {
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
      }
    );

    revalidatePath(`/dashboard/projects/${projectId}`);

    return {
      success: true,
      message: 'Automation cycle started successfully.',
      jobId: job.id,
    };
  } catch (error) {
    return handleActionError(error, 'triggerAutomationCycle');
  }
}
