'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { encrypt } from '@/lib/crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const onboardingSchema = z.object({
  projectName: z.string().min(3),
  shortCode: z.string().min(3).max(6).toUpperCase(),
  instagramId: z.string().optional(),
  instagramToken: z.string().optional(),
});

export async function completeOnboarding(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const data = Object.fromEntries(formData.entries());
  const parsed = onboardingSchema.safeParse(data);

  if (!parsed.success) {
    return { error: 'Invalid fields', details: parsed.error.flatten() };
  }

  const { projectName, shortCode, instagramId, instagramToken } = parsed.data;

  try {
    // 1. Create Project
    const project = await prisma.project.create({
      data: {
        name: projectName,
        shortCode: shortCode,
        userId: session.user.id,
      },
    });

    // 2. Connect Social (if provided)
    if (instagramId && instagramToken) {
      await prisma.socialAccount.create({
        data: {
          platform: 'INSTAGRAM',
          profileName: `${projectName} (IG)`,
          platformId: instagramId,
          accessToken: encrypt(instagramToken),
          userId: session.user.id,
        },
      });
    }
  } catch (e: any) {
    if (e.code === 'P2002') return { error: 'Project ShortCode already exists.' };
    return { error: 'Failed to create brand.' };
  }

  redirect('/dashboard/projects');
}
