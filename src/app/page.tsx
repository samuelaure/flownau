import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Video, Library, Settings, Users } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="mt-2 text-gray-400">Welcome back, {session.user?.name || 'User'}.</p>
        </div>
        <div className="flex gap-4">
          <button className="rounded-full bg-white px-6 py-2 font-medium text-black transition-all hover:bg-gray-200">
            + New Project
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Projects" value="12" icon={<LayoutDashboard />} />
        <StatCard title="Videos Rendered" value="148" icon={<Video />} />
        <StatCard title="Storage Used" value="4.2 GB" icon={<Library />} />
        <StatCard title="Social Reach" value="2.4k" icon={<Users />} />
      </div>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-white">Recent Renders</h2>
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-gray-900/50 backdrop-blur-xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-sm text-gray-400 uppercase">
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Preview</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5 transition-colors hover:bg-white/5">
                <td className="px-6 py-4 font-medium">Daily Horoscope #14</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                    Completed
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">2 hours ago</td>
                <td className="px-6 py-4">
                  <button className="rounded-lg border border-white/10 px-4 py-1 text-sm transition-all hover:border-white/30">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="group rounded-2xl border border-white/5 bg-gray-900/40 p-6 transition-all hover:shadow-2xl hover:shadow-white/5">
      <div className="mb-4 flex items-start justify-between">
        <div className="rounded-xl bg-white/5 p-3 transition-transform group-hover:scale-110">
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
