'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { renderQueue } from '@/lib/queue';
import { revalidatePath } from 'next/cache';

export async function createRender(projectId: string, templateId: string, params: any) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const render = await prisma.render.create({
    data: {
      templateId,
      params,
      projectId,
    },
  });

  // Add to BullMQ queue
  await renderQueue.add('render-video', { renderId: render.id });

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { success: true, renderId: render.id };
}
