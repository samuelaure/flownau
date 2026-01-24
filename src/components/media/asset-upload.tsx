"use client";

import { useState } from "react";
import { uploadAsset } from "@/actions/assets";
import { UploadCloud, CheckCircle, XCircle, Loader2 } from "lucide-react";

export function AssetUpload({ workspaceId, projectId }: { workspaceId: string; projectId: string }) {
    const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [error, setError] = useState("");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus("uploading");
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadAsset(formData, workspaceId, projectId);
            if (result.success) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 3000);
            }
        } catch (err: any) {
            setError(err.message);
            setStatus("error");
        }
    };

    return (
        <div className="w-full">
            <label className={`
        flex flex-col items-center justify-center w-full h-64 
        border-2 border-dashed rounded-3xl cursor-pointer
        transition-all duration-300
        ${status === "uploading" ? "border-white/20 bg-white/5 cursor-wait" :
                    status === "success" ? "border-green-500/50 bg-green-500/10" :
                        status === "error" ? "border-red-500/50 bg-red-500/10" :
                            "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"}
      `}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {status === "uploading" ? (
                        <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
                    ) : status === "success" ? (
                        <CheckCircle className="w-12 h-12 text-green-400 mb-4" />
                    ) : status === "error" ? (
                        <XCircle className="w-12 h-12 text-red-400 mb-4" />
                    ) : (
                        <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                    )}

                    <p className="mb-2 text-sm text-white font-medium">
                        {status === "uploading" ? "Uploading to Cloudflare R2..." :
                            status === "success" ? "Upload Complete!" :
                                status === "error" ? "Upload Failed" :
                                    "Click or drag assets to upload"}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest">
                        {error ? error : "Video, Audio or Images"}
                    </p>
                </div>
                <input
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={status === "uploading"}
                />
            </label>
        </div>
    );
}
