import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { AssetUploader } from './_components/asset-uploader';
import { AssetGrid } from './_components/asset-grid';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AssetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Fetch projects to allow selecting where to upload
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    select: { id: true, name: true, shortCode: true },
  });

  if (projects.length === 0) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold">No Projects Found</h2>
        <p className="text-zinc-400">Create a project first to start managing assets.</p>
        <Button asChild>
          <Link href="/dashboard/projects/new">Create Project</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Asset Library</h2>
          <p className="text-muted-foreground">Manage your video backgrounds, music, and images.</p>
        </div>
      </div>

      <AssetUploader projects={projects} />

      <div className="mt-8">
        <h3 className="mb-4 text-lg font-medium">Recent Uploads</h3>
        <AssetGrid userId={session.user.id} />
      </div>
    </div>
  );
}
