import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Sidebar } from './_components/sidebar';
import { UserNav } from './_components/user-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950 px-6">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Flownaŭ</h1>
          </div>
          <UserNav user={session.user} />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
