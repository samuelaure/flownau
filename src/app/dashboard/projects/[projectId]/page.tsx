import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { AssetUploader } from '@/app/dashboard/assets/_components/asset-uploader';
import { AssetGrid } from '@/app/dashboard/assets/_components/asset-grid';
import { AutomationTrigger } from './_components/automation-trigger';

// Reusing AssetGrid logic but filtering via props in future iteration
// For now, simpler implementation specific to project

export default async function ProjectDetailsPage({ params }: { params: { projectId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const project = await prisma.project.findUnique({
    where: {
      id: params.projectId,
      userId: session.user.id,
    },
    include: {
      _count: { select: { assets: true, renders: true } },
    },
  });

  if (!project) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <p className="text-zinc-400">Manage automation content for {project.shortCode}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Fast Ingestion</h3>
          {/* Passing single project array to lock uploader to this context */}
          <AssetUploader projects={[project]} />
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Engine Control</h3>
          <AutomationTrigger projectId={project.id} />
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Latest Assets</h3>
        {/* We'll filter this properly on backend in next iteration */}
        <div className="pointer-events-none opacity-50">
          <p className="mb-2 text-sm text-yellow-500">
            Global asset view (Filtering pending implementation)
          </p>
          <AssetGrid userId={session.user.id} />
        </div>
      </div>
    </div>
  );
}
