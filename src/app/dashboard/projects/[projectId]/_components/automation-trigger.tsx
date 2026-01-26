'use client';

import { useState } from 'react';
import { triggerAutomationCycle } from '@/actions/automation';
import { Button } from '@/components/ui/button';
import { Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function AutomationTrigger({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    setLoading(true);
    try {
      const result = await triggerAutomationCycle(projectId);
      if (result.success) {
        toast.success(result.message as string);
      } else {
        toast.error((result as any).error || 'Failed to trigger automation');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h4 className="text-lg font-bold text-white">Automation Engine</h4>
          <p className="text-sm text-zinc-400">Fetch approved content and publish to Instagram</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
          <Play size={20} />
        </div>
      </div>

      <Button
        onClick={handleRun}
        disabled={loading}
        className="w-full gap-2 bg-indigo-600 font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Engaging Engine...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 fill-current" />
            Run Cycle Now
          </>
        )}
      </Button>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <CheckCircle size={14} className="text-green-500" />
          Airtable Connected
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <CheckCircle size={14} className="text-green-500" />
          Instagram Linked
        </div>
      </div>
    </div>
  );
}
