import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Video, Library, Users, ArrowUpRight, Plus, History } from 'lucide-react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function DashboardOverview() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;

  // Fetch real data
  const [projectCount, renderCount, assetStats, socialCount, recentRenders] = await Promise.all([
    prisma.project.count({ where: { userId } }),
    prisma.render.count({ where: { project: { userId }, status: 'COMPLETED' } }),
    prisma.asset.aggregate({
      where: { project: { userId } },
      _sum: { sizeBytes: true },
    }),
    prisma.socialAccount.count({ where: { userId } }),
    prisma.render.findMany({
      where: { project: { userId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { project: true },
    }),
  ]);

  const storageUsedGB = Number(assetStats._sum.sizeBytes || BigInt(0)) / (1024 * 1024 * 1024);

  return (
    <div className="animate-in fade-in flex flex-col gap-8 duration-500">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-zinc-400">
          System status and recent activity for your automation engine.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={projectCount.toString()}
          icon={<LayoutDashboard className="h-5 w-5 text-indigo-400" />}
          description="Total managed brands"
        />
        <StatCard
          title="Videos Rendered"
          value={renderCount.toString()}
          icon={<Video className="h-5 w-5 text-emerald-400" />}
          description="Completed exports"
        />
        <StatCard
          title="Storage Used"
          value={`${storageUsedGB.toFixed(2)} GB`}
          icon={<Library className="h-5 w-5 text-amber-400" />}
          description="In Cloudflare R2"
        />
        <StatCard
          title="Integrations"
          value={socialCount.toString()}
          icon={<Users className="h-5 w-5 text-pink-400" />}
          description="Social channels linked"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <History className="h-5 w-5 text-zinc-400" />
              Recent Renders
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/projects" className="text-zinc-400 hover:text-white">
                View Projects <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentRenders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pt-0 pb-3 font-medium">Project</th>
                      <th className="pt-0 pb-3 font-medium">Status</th>
                      <th className="pt-0 pb-3 font-medium">Date</th>
                      <th className="pt-0 pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {recentRenders.map((render) => (
                      <tr key={render.id} className="group transition-colors hover:bg-zinc-800/30">
                        <td className="py-4 font-medium text-zinc-200">{render.project.name}</td>
                        <td className="py-4">
                          <StatusBadge status={render.status} />
                        </td>
                        <td className="py-4 text-zinc-500">
                          {new Date(render.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-zinc-700 bg-zinc-800 text-xs text-zinc-300 hover:bg-zinc-700"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-zinc-800/50 p-4">
                  <Video className="h-8 w-8 text-zinc-600" />
                </div>
                <h3 className="text-lg font-medium text-zinc-300">No renders found</h3>
                <p className="text-sm text-zinc-500">
                  Your render history will appear here once you start a job.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-400">
              Create a new automated brand project to start generating content from Airtable data.
            </p>
            <Button
              asChild
              className="w-full border-none bg-indigo-600 font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
            >
              <Link href="/dashboard/onboarding" className="flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> New Project
              </Link>
            </Button>
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <h4 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                Helpful Links
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/dashboard/projects"
                    className="group flex items-center justify-between text-zinc-400 transition-colors hover:text-indigo-400"
                  >
                    Manage Brands
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/assets"
                    className="group flex items-center justify-between text-zinc-400 transition-colors hover:text-indigo-400"
                  >
                    Asset Library
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="group border-zinc-800 bg-zinc-900/40 transition-all hover:border-zinc-700 hover:bg-zinc-900/60">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-300">
          {title}
        </CardTitle>
        <div className="rounded-md border border-zinc-700 bg-zinc-800/80 p-2 transition-transform group-hover:scale-110">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    FAILED: 'bg-red-500/10 text-red-400 border-red-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PROCESSING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  };

  return (
    <Badge
      variant="outline"
      className={`${styles[status] || styles.PENDING} border text-[10px] font-medium tracking-wider uppercase`}
    >
      {status.toLowerCase()}
    </Badge>
  );
}
