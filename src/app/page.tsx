import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { LayoutDashboard, Video, Library, Settings, Users } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();
    if (!session) redirect("/login");

    return (
        <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-gray-400 mt-2">Welcome back, {session.user?.name || "User"}.</p>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition-all">
                        + New Project
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Active Projects" value="12" icon={<LayoutDashboard />} />
                <StatCard title="Videos Rendered" value="148" icon={<Video />} />
                <StatCard title="Storage Used" value="4.2 GB" icon={<Library />} />
                <StatCard title="Social Reach" value="2.4k" icon={<Users />} />
            </div>

            <section>
                <h2 className="text-xl font-semibold text-white mb-6">Recent Renders</h2>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-gray-400 text-sm uppercase">
                                <th className="px-6 py-4 font-medium">Project</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Date</th>
                                <th className="px-6 py-4 font-medium">Preview</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-300">
                            <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium">Daily Horoscope #14</td>
                                <td className="px-6 py-4">
                                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs">Completed</span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">2 hours ago</td>
                                <td className="px-6 py-4">
                                    <button className="text-sm border border-white/10 px-4 py-1 rounded-lg hover:border-white/30 transition-all">View</button>
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
        <div className="bg-gray-900/40 p-6 rounded-2xl border border-white/5 hover:shadow-2xl hover:shadow-white/5 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                    {icon}
                </div>
            </div>
            <p className="text-gray-500 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}
