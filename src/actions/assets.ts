"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { r2Client } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function uploadAsset(formData: FormData, workspaceId: string, projectId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("Unauthorized");

    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

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
        return { success: true, asset: existingAsset, deduplicated: true };
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

    revalidatePath(`/dashboard/${workspaceId}/projects/${projectId}`);

    // Convert BigInt for client-side serialization
    return {
        success: true,
        asset: { ...asset, sizeBytes: asset.sizeBytes.toString() }
    };
}
