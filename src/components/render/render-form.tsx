"use client";

import { useState } from "react";
import { createRender } from "@/actions/render";
import { Play, Loader2 } from "lucide-react";

export function RenderForm({ projectId, templateId }: { projectId: string; templateId: string }) {
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState("Hello World");

    const handleRender = async () => {
        setLoading(true);
        try {
            await createRender(projectId, templateId, { text });
            alert("Render job queued! Check the worker logs.");
        } catch (err) {
            alert("Failed to queue render");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass p-8 rounded-3xl space-y-6">
            <h3 className="text-xl font-bold outfit">Configure Render</h3>
            <div className="space-y-4">
                <div>
                    <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Main Text</label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full mt-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:ring-2 focus:ring-white/20"
                    />
                </div>
            </div>
            <button
                onClick={handleRender}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                {loading ? "Queuing..." : "Start Render"}
            </button>
        </div>
    );
}
