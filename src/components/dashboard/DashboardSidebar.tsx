"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { MessageSquareText, TrendingUp, Plus, Trash2, Loader2 } from "lucide-react";

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
                router.refresh(); // Tells layout to reload allChannels from server
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

    // Derive active channel client-side from URL param
    const activeChannel = channelIdFromUrl
        ? allChannels.find((c: any) => c.id === channelIdFromUrl) || defaultChannel
        : defaultChannel;

    const isBotPage = pathname?.startsWith("/dashboard/bot");
    const isDashboardHome = pathname === "/dashboard" || (!isBotPage && pathname?.startsWith("/dashboard"));

    return (
        <aside className="w-full md:w-72 border-r border-white/[0.06] bg-[#0a0a0f]/50 backdrop-blur-xl flex flex-col z-20">
            <div className="p-6 pb-2">
                <Link href="/" className="flex items-center gap-2.5 group mb-8">
                    <img src="/auraiq-logo.png" alt="AuraIQ Logo" className="w-9 h-9 object-contain" />
                    <span className="text-base font-bold text-white">AuraIQ</span>
                </Link>

                {/* Main Navigation */}
                <div className="space-y-1 mb-8">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-2">Menu</div>
                    <Link 
                        href={`/dashboard?channelId=${activeChannel.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                            isDashboardHome
                                ? "bg-violet-500/10 text-white border border-violet-500/20"
                                : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                    >
                        <TrendingUp className={`w-4 h-4 ${isDashboardHome ? "text-violet-400" : "text-slate-500"}`} />
                        Growth Dashboard
                    </Link>
                    <Link 
                        href={`/dashboard/bot?channelId=${activeChannel.id}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors font-medium text-sm ${
                            isBotPage
                                ? "bg-blue-500/10 text-white border border-blue-500/20"
                                : "text-slate-300 hover:text-white hover:bg-white/5 border border-transparent"
                        }`}
                    >
                        <MessageSquareText className={`w-4 h-4 ${isBotPage ? "text-blue-400" : "text-slate-500"}`} />
                        AuraBot AI Studio
                    </Link>
                </div>

                {/* Channels List */}
                <div className="flex items-center justify-between mb-3 px-2">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">My Channels</h2>
                    <Link 
                        href="/onboarding?force=true" 
                        className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center hover:bg-violet-600 hover:text-white transition-all text-sm font-bold"
                        title="Add New Channel"
                    >
                        <Plus className="w-3 h-3" />
                    </Link>
                </div>
                
                <div className="space-y-1">
                    {allChannels.map((channel: any) => (
                        <Link
                            key={channel.id}
                            href={`/dashboard?channelId=${channel.id}`}
                            className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl transition-all group ${
                                activeChannel.id === channel.id 
                                ? "bg-violet-600/10 border border-violet-500/30 text-white shadow-[0_0_15px_rgba(139,92,246,0.05)]" 
                                : "hover:bg-white/5 border border-transparent text-slate-400"
                            }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeChannel.id === channel.id ? "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" : "bg-slate-700 opacity-50 group-hover:opacity-100 transition-opacity"}`} />
                                <span className="text-sm font-medium truncate">{channel.name}</span>
                            </div>
                            
                            <button
                                onClick={(e) => handleDelete(e, channel.id, channel.name)}
                                disabled={deletingId === channel.id}
                                className={`shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                    deletingId === channel.id 
                                    ? "opacity-100 cursor-not-allowed" 
                                    : "hover:bg-red-500/20 text-slate-500 hover:text-red-400"
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

            {/* Profile small toggle */}
            <div className="mt-auto p-6 border-t border-white/5 flex items-center gap-3">
                {session.user.image && (
                        <img src={session.user.image} alt={session.user.name ?? "User"} className="w-8 h-8 rounded-full ring-1 ring-violet-500/40" />
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{session.user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{session.user.email}</p>
                </div>
            </div>
        </aside>
    );
}
