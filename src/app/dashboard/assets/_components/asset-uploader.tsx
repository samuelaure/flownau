'use client';

import { useState } from 'react';
import { uploadAsset } from '@/actions/assets';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Project = { id: string; name: string; shortCode: string };

export function AssetUploader({ projects }: { projects: Project[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!selectedProjectId) {
      toast.error('Error', {
        description: 'Please select a project first',
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const result = await uploadAsset(formData, selectedProjectId);
      if (result.success) {
        toast.info(result.deduplicated ? 'Duplicate Detected' : 'Upload Complete', {
          description: result.deduplicated
            ? 'This file already exists. We linked it to the project.'
            : 'Asset processed and uploaded to R2 successfully.',
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload Failed', {
        description: 'Could not upload asset.',
      });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-4">
          <div className="w-[200px]">
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.shortCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="group relative flex-1">
            <input
              type="file"
              className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-6 transition-colors group-hover:border-zinc-500">
              {isUploading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                  <span className="text-zinc-400">Processing & Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 text-zinc-400" />
                  <span className="text-zinc-400">Drag file or click to upload</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
