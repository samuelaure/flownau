import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowRight } from 'lucide-react';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { assets: true, renders: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Your Brands</h2>
        <Button asChild>
          <Link href="/dashboard/onboarding" className="gap-2">
            <Plus className="h-4 w-4" /> New Brand
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
            <Card className="h-full border-zinc-800 bg-zinc-900 transition-colors hover:border-zinc-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl font-bold">{project.name}</CardTitle>
                <span className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">
                  {project.shortCode}
                </span>
              </CardHeader>
              <CardContent>
                <div className="mt-4 flex justify-between text-sm text-zinc-400">
                  <span>{project._count.assets} assets</span>
                  <span>{project._count.renders} renders</span>
                </div>
                <div className="mt-4 flex items-center text-sm font-medium text-indigo-400">
                  manage <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="col-span-full rounded-lg border-2 border-dashed border-zinc-800 py-20 text-center">
            <h3 className="text-lg font-medium text-zinc-300">No brands yet</h3>
            <p className="mb-4 text-zinc-500">Start by creating your first automated brand.</p>
            <Button asChild variant="secondary">
              <Link href="/dashboard/onboarding">Create Brand</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
