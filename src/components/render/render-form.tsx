'use client';

import { useState } from 'react';
import { createRender } from '@/actions/render';
import { Play, Loader2 } from 'lucide-react';

export function RenderForm({ projectId, templateId }: { projectId: string; templateId: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('Hello World');

  const handleRender = async () => {
    setLoading(true);
    try {
      await createRender(projectId, templateId, { text });
      alert('Render job queued! Check the worker logs.');
    } catch (err) {
      alert('Failed to queue render');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass space-y-6 rounded-3xl p-8">
      <h3 className="outfit text-xl font-bold">Configure Render</h3>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold tracking-widest text-gray-500 uppercase">
            Main Text
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>
      <button
        onClick={handleRender}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-black transition-all hover:bg-gray-200 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Play className="h-5 w-5 fill-current" />
        )}
        {loading ? 'Queuing...' : 'Start Render'}
      </button>
    </div>
  );
}
