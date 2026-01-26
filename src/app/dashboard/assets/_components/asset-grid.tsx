import prisma from '@/lib/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Music, Image as ImageIcon } from 'lucide-react';

export async function AssetGrid({ userId }: { userId: string }) {
  const assets = await prisma.asset.findMany({
    where: {
      project: { userId: userId },
    },
    orderBy: { createdAt: 'desc' },
    take: 12,
    include: { project: true },
  });

  if (assets.length === 0) {
    return <div className="text-sm text-zinc-500">No assets found.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} />
      ))}
    </div>
  );
}

function AssetCard({ asset }: { asset: any }) {
  return (
    <Card className="overflow-hidden border-zinc-800 bg-zinc-900">
      <div className="relative flex aspect-video items-center justify-center bg-zinc-950">
        {asset.type === 'VIDEO' && <Video className="h-8 w-8 text-zinc-700" />}
        {asset.type === 'AUDIO' && <Music className="h-8 w-8 text-zinc-700" />}
        {asset.type === 'IMAGE' && <ImageIcon className="h-8 w-8 text-zinc-700" />}
        <Badge className="absolute top-2 right-2 bg-black/50 hover:bg-black/70">{asset.type}</Badge>
      </div>
      <CardContent className="p-3">
        <p className="mb-1 truncate text-sm font-medium" title={asset.originalFilename}>
          {asset.originalFilename}
        </p>
        <p className="flex justify-between text-xs text-zinc-500">
          <span>{asset.project.shortCode}</span>
          <span>{(Number(asset.sizeBytes) / 1024 / 1024).toFixed(1)} MB</span>
        </p>
      </CardContent>
    </Card>
  );
}
