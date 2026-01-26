'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

import { AuthenticationError, ValidationError } from '@/lib/exceptions';
import { handleActionError } from '@/lib/error-handler';
import { r2Logger } from '@/lib/logger';

export async function uploadAsset(formData: FormData, projectId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new AuthenticationError();

    // Authorization check could happen here (is `session.user.id` owner of `projectId`?)

    const file = formData.get('file') as File;
    if (!file) throw new ValidationError('No file uploaded');

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await IngestionService.processBuffer(buffer, file.name, file.type, projectId);

    if (!result.success) {
      throw new Error(result.error || 'Upload processing failed');
    }

    revalidatePath(`/dashboard/projects/${projectId}`);

    const asset = result.asset;
    return {
      success: true,
      asset: { ...asset, sizeBytes: asset.sizeBytes.toString() },
      deduplicated: result.deduplicated,
    };
  } catch (error) {
    return handleActionError(error, 'uploadAsset');
  }
}
