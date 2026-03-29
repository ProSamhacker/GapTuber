"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { MessageSquareText, TrendingUp, Plus, Trash2, Loader2, Youtube } from "lucide-react";

interface DashboardSidebarProps {
    session: any;
    allChannels: any[];
    activeChannel: any; // default/fallback channel from server
}

export function DashboardSidebar({ session, allChannels, activeChannel: defaultChannel }: DashboardSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const channelIdFromUrl = searchParams?.get("channelId");
    
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (e: React.MouseEvent, channelId: string, channelName: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm(`Are you sure you want to delete "${channelName}"?\nAll associated data will be permanently removed.`)) {
            return;
        }

        setDeletingId(channelId);
        try {
            const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
            if (res.ok) {
                if (activeChannel.id === channelId) {
                    const remaining = allChannels.filter((c: any) => c.id !== channelId);
                    if (remaining.length > 0) {
                        router.push(`/dashboard?channelId=${remaining[0].id}`);
                    } else {
                        router.push(`/onboarding`);
                    }
                }
                router.refresh(); 
            } else {
                alert("Failed to delete channel.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred while deleting the channel.");
        } finally {
            setDeletingId(null);
        }
    };

    const activeChannel = channelIdFromUrl
        ? allChannels.find((c: any) => c.id === channelIdFromUrl) || defaultChannel
        : defaultChannel;

    const isBotPage = pathname?.startsWith("/dashboard/bot");
    const isSettingsPage = pathname?.startsWith("/dashboard/settings");
    const isDashboardHome = pathname === "/dashboard" || (!isBotPage && !isSettingsPage && pathname?.startsWith("/dashboard"));

    return (
        <aside className="w-full md:w-72 bg-[#0c0c0e] border-r border-[#1e1e22] flex flex-col z-20">
            <div className="p-6 pb-2">
                <Link href="/" className="flex items-center gap-2.5 mb-8">
                    <img src="/logo.svg" alt="GapTuber Logo" className="h-[28px] w-auto" />
                    <span className="text-sm font-bold text-white font-mono tracking-tight">GapTuber</span>
                    <span className="text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">beta</span>
                </Link>

                {/* Main Navigation */}
                <div className="space-y-1 mb-8">
                    <div className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-3 px-2">Menu</div>
                    <Link 
                        href={`/dashboard?channelId=${activeChannel.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm ${
                            isDashboardHome
                                ? "bg-[#111113] text-white border border-[#1e1e22]"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#111113] border border-transparent"
                        }`}
                    >
                        <TrendingUp className={`w-4 h-4 ${isDashboardHome ? "text-emerald-400" : "text-zinc-500"}`} />
                        Growth Dashboard
                    </Link>
                    <Link 
                        href={`/dashboard/bot?channelId=${activeChannel.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm ${
                            isBotPage
                                ? "bg-[#111113] text-white border border-[#1e1e22]"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#111113] border border-transparent"
                        }`}
                    >
                        <MessageSquareText className={`w-4 h-4 ${isBotPage ? "text-emerald-400" : "text-zinc-500"}`} />
                        GapTuber AI Studio
                    </Link>
                    <Link 
                        href={`/dashboard/settings?channelId=${activeChannel.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm ${
                            isSettingsPage
                                ? "bg-[#111113] text-white border border-[#1e1e22]"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-[#111113] border border-transparent"
                        }`}
                    >
                        <Youtube className={`w-4 h-4 ${isSettingsPage ? "text-emerald-400" : "text-zinc-500"}`} />
                        YouTube Connection
                    </Link>
                </div>

                {/* Channels List */}
                <div className="flex items-center justify-between mb-3 px-2">
                    <h2 className="text-xs font-mono text-zinc-600 uppercase tracking-widest">Projects</h2>
                    <Link 
                        href="/onboarding?force=true" 
                        className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="Add New Channel"
                    >
                        <Plus className="w-4 h-4" />
                    </Link>
                </div>
                
                <div className="space-y-1">
                    {allChannels.map((channel: any) => (
                        <Link
                            key={channel.id}
                            href={`/dashboard?channelId=${channel.id}`}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-all group ${
                                activeChannel.id === channel.id 
                                ? "bg-[#111113] border border-[#1e1e22] text-white" 
                                : "hover:bg-[#111113] border border-transparent text-zinc-500"
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeChannel.id === channel.id ? "bg-emerald-400" : "bg-zinc-700 opacity-50 group-hover:opacity-100 transition-opacity"}`} />
                                <span className="text-sm font-medium truncate">{channel.name}</span>
                            </div>
                            
                            <button
                                onClick={(e) => handleDelete(e, channel.id, channel.name)}
                                disabled={deletingId === channel.id}
                                className={`shrink-0 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
                                    deletingId === channel.id 
                                    ? "opacity-100 cursor-not-allowed" 
                                    : "hover:bg-[#1e1e22] text-zinc-600 hover:text-red-400"
                                }`}
                                title="Delete Channel"
                            >
                                {deletingId === channel.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                )}
                            </button>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Profile */}
            <div className="mt-auto p-6 border-t border-[#1e1e22] flex items-center gap-3">
                {session.user.image && (
                    <img src={session.user.image} alt={session.user.name ?? "User"} className="w-8 h-8 rounded border border-[#1e1e22] grayscale opacity-80" />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 truncate">{session.user.name}</p>
                    <p className="text-xs text-zinc-600 truncate">{session.user.email}</p>
                </div>
            </div>
        </aside>
    );
}
