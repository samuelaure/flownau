"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { r2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

import { AuthenticationError, ValidationError } from "@/lib/exceptions";
import { handleActionError } from "@/lib/error-handler";
import { r2Logger } from "@/lib/logger";

export async function uploadAsset(formData: FormData, workspaceId: string, projectId: string) {
    try {
        const session = await auth();
        if (!session?.user) throw new AuthenticationError();

        const file = formData.get("file") as File;
        if (!file) throw new ValidationError("No file uploaded");

        r2Logger.info({ workspaceId, projectId, fileName: file.name }, "Starting asset upload");

        const buffer = Buffer.from(await file.arrayBuffer());
        const hash = crypto.createHash("sha256").update(buffer).digest("hex");

        // Check for deduplication
        const existingAsset = await prisma.asset.findUnique({
            where: {
                projectId_hash: {
                    projectId,
                    hash,
                },
            },
        });

        if (existingAsset) {
            r2Logger.info({ assetId: existingAsset.id }, "Asset deduplicated");
            return { success: true, asset: { ...existingAsset, sizeBytes: existingAsset.sizeBytes.toString() }, deduplicated: true };
        }

        const extension = file.name.split(".").pop();
        const assetType = file.type.startsWith("video") ? "VIDEO" : file.type.startsWith("audio") ? "AUDIO" : "IMAGE";

        // Naming convention: {workspaceId}/{projectId}/{type}/{hash}.{ext}
        const r2Key = `${workspaceId}/${projectId}/${assetType.toLowerCase()}s/${hash}.${extension}`;

        await r2Client.send(
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME!,
                Key: r2Key,
                Body: buffer,
                ContentType: file.type,
            })
        );

        const asset = await prisma.asset.create({
            data: {
                type: assetType,
                systemFilename: `${hash}.${extension}`,
                originalFilename: file.name,
                hash,
                r2Key,
                sizeBytes: BigInt(file.size),
                mimeType: file.type,
                projectId,
            },
        });

        r2Logger.info({ assetId: asset.id, r2Key }, "Asset uploaded successfully");

        revalidatePath(`/dashboard/${workspaceId}/projects/${projectId}`);

        return {
            success: true,
            asset: { ...asset, sizeBytes: asset.sizeBytes.toString() }
        };
    } catch (error) {
        return handleActionError(error, "uploadAsset");
    }
}
