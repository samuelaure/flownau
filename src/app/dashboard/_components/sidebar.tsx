import Link from 'next/link';
import { Home, Layers, PlaySquare, Settings, UploadCloud } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-zinc-800 bg-zinc-950 md:block">
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center border-b border-zinc-800 px-6">
          <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-xl font-bold text-transparent">
            FN
          </span>
        </div>
        <nav className="flex-1 space-y-2 p-4">
          <NavItem href="/dashboard" icon={Home} label="Overview" />
          <NavItem href="/dashboard/projects" icon={Layers} label="Projects" />
          <NavItem href="/dashboard/assets" icon={UploadCloud} label="Asset Library" />
          <NavItem href="/dashboard/settings" icon={Settings} label="Settings" />
        </nav>
      </div>
    </aside>
  );
}

function NavItem({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white"
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
