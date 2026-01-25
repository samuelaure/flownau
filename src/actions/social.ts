'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

export async function addInstagramAccount(
  workspaceId: string,
  profileName: string,
  platformId: string,
  accessToken: string
) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // TODO: Verify if user has access to workspace

  const encryptedToken = encrypt(accessToken);

  const account = await prisma.socialAccount.create({
    data: {
      platform: 'INSTAGRAM',
      profileName,
      platformId,
      accessToken: encryptedToken,
      workspaceId,
    },
  });

  revalidatePath(`/dashboard/${workspaceId}/settings/social`);
  return { success: true, accountId: account.id };
}

export async function getSocialToken(accountId: string) {
  // INTERNAL USE ONLY: Should be called by worker
  const account = await prisma.socialAccount.findUnique({
    where: { id: accountId },
  });

  if (!account) throw new Error('Account not found');

  return decrypt(account.accessToken);
}
