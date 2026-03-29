import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { 
    getUserByEmail, 
    getChannelsByUserId, 
    getChannelScans 
} from "@/db/queries";
import Link from "next/link";
import type { GapItem, ScanAnalytics } from "@/db/schema";
import FlashcardRoadmap from "@/components/dashboard/FlashcardRoadmap";

export const metadata = {
    title: "Dashboard — GapTuber",
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, colorClass }: { label: string; score: number; colorClass: string }) {
    return (
        <div className="flex items-center gap-3 mb-2.5">
            <span className="text-[11px] font-mono uppercase text-zinc-500 w-24 flex-shrink-0">{label}</span>
            <div className="flex-1 h-1.5 bg-[#1e1e22] rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className="text-[11px] font-mono font-bold text-zinc-400 w-8 text-right tabular-nums">{score}</span>
        </div>
    );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
    value, label, icon
}: { value: string; label: string; icon: string }) {
    return (
        <div className="rounded-lg p-3 border border-[#1e1e22] bg-[#0c0c0e]">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-xl font-bold text-white tabular-nums leading-none tracking-tight">{value}</div>
            <div className="text-[10px] font-mono text-zinc-600 mt-1.5 uppercase tracking-widest">{label}</div>
        </div>
    );
}

// ─── Gap Card ─────────────────────────────────────────────────────────────────

function GapCard({ gap, rank }: { gap: GapItem; rank: number }) {
    const isTopGap = gap.gapScore >= 8;
    
    return (
        <div className={`rounded-xl border bg-[#111113] overflow-hidden ${isTopGap ? "border-emerald-600/30" : "border-[#1e1e22]"}`}>
            {/* Card header */}
            <div className="px-5 py-3 border-b border-[#1e1e22] flex items-center justify-between bg-[#0c0c0e]">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">gap_result_0{rank}</span>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${isTopGap ? "bg-emerald-600/10 text-emerald-400 border-emerald-600/20" : "bg-[#1e1e22] text-zinc-400 border-[#2a2a30]"}`}>
                    score:{gap.gapScore}
                </div>
            </div>

            <div className="p-5 space-y-4">
                {/* Title */}
                <h3 className="font-bold text-zinc-100 text-sm leading-snug">{gap.title}</h3>

                {/* Reasoning */}
                <p className="text-[13px] text-zinc-500 leading-relaxed">{gap.reasoning}</p>

                {/* Hook */}
                <div className="bg-[#0c0c0e] border border-[#1e1e22] rounded p-3">
                    <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">hook_string</div>
                    <p className="text-[13px] text-zinc-300 italic">&ldquo;{gap.hook}&rdquo;</p>
                </div>

                {/* Target Audience */}
                {gap.targetAudience && (
                    <div className="bg-[#0c0c0e] border border-[#1e1e22] rounded p-3">
                        <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">target_audience</div>
                        <p className="text-[13px] text-zinc-300">{gap.targetAudience}</p>
                    </div>
                )}

                {/* Content Outline */}
                {gap.contentOutline && gap.contentOutline.length > 0 && (
                    <div className="pt-2">
                        <div className="text-[10px] font-mono text-zinc-600 mb-2 uppercase">content_outline</div>
                        <div className="space-y-1.5">
                            {gap.contentOutline.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-[13px] text-zinc-400">
                                    <span className="font-mono text-zinc-600 mt-[1px]">{(i+1).toString().padStart(2, '0')}</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Competitor Weakness */}
                {gap.competitorWeakness && (
                    <div className="pt-2 border-t border-[#1e1e22]">
                        <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">competitor_weakness</div>
                        <p className="text-[13px] text-zinc-400">{gap.competitorWeakness}</p>
                    </div>
                )}

                {/* Format + Monetization */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e1e22]">
                    <div>
                        <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">format</div>
                        <p className="text-xs text-zinc-300">{gap.format}</p>
                    </div>
                    <div>
                        <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">angle</div>
                        <p className="text-xs text-zinc-300">{gap.monetizationAngle}</p>
                    </div>
                </div>

                {/* SEO Tips */}
                {gap.seoTips && gap.seoTips.length > 0 && (
                    <div className="pt-2 border-t border-[#1e1e22]">
                        <div className="text-[10px] font-mono text-zinc-600 mb-2 uppercase">seo_params</div>
                        <div className="space-y-1">
                            {gap.seoTips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-2 text-[13px] text-zinc-400">
                                    <span className="text-zinc-600 flex-shrink-0">—</span>
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Analytics Panel ───────────────────────────────────────────────────────────

function AnalyticsPanel({ analytics }: { analytics: ScanAnalytics }) {
    const metrics = [
        { value: analytics.velocity.score.toFixed(1), label: "Velocity", icon: "📈" },
        { value: analytics.saturation.score.toFixed(1), label: "Opportunity", icon: "💎" },
        { value: analytics.frustration.score.toFixed(1), label: "Frustration", icon: "😤" },
        { value: analytics.trend.score.toFixed(1), label: "Trend_Match", icon: "📊" },
    ];

    return (
        <div className="bg-[#111113] border border-[#1e1e22] rounded-xl p-5 mb-8">
            <h3 className="text-sm font-mono text-zinc-300 uppercase tracking-widest border-b border-[#1e1e22] pb-3 mb-4">
                Scan_Analytics_Data
            </h3>

            {/* Score cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {metrics.map(m => (
                    <MetricCard key={m.label} {...m} />
                ))}
            </div>

            {/* Score bars & Insights split */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Score bars */}
                <div>
                    <h4 className="text-[10px] font-mono text-zinc-600 uppercase mb-3">Signal Strengths</h4>
                    <ScoreBar label="Velocity" score={Math.round(analytics.velocity.score * 10)} colorClass="bg-zinc-300" />
                    <ScoreBar label="Opportunity" score={Math.round(analytics.saturation.score * 10)} colorClass="bg-zinc-300" />
                    <ScoreBar label="Frustration" score={Math.round(analytics.frustration.score * 10)} colorClass="bg-zinc-400" />
                    <ScoreBar label="Trend" score={Math.round(analytics.trend.score * 10)} colorClass="bg-zinc-400" />
                    <ScoreBar label="Competition" score={Math.round(analytics.competition.score * 10)} colorClass="bg-zinc-500" />
                    <ScoreBar label="Engagement" score={Math.round(analytics.engagement.score * 10)} colorClass="bg-zinc-600" />
                </div>

                {/* Insights */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-mono text-zinc-600 uppercase mb-3">Computed Insights</h4>
                    <div className="bg-[#0c0c0e] border border-[#1e1e22] rounded p-3">
                        <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">Best_Upload_Window</div>
                        <div className="text-sm font-bold text-zinc-200">{analytics.uploadSchedule.bestDay} • {analytics.uploadSchedule.bestHour}:00 UTC</div>
                        <div className="text-xs text-zinc-500 mt-1">{analytics.uploadSchedule.insight}</div>
                    </div>
                    <div className="bg-[#0c0c0e] border border-[#1e1e22] rounded p-3">
                        <div className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">Velocity_Signal</div>
                        <div className="text-xs text-zinc-400 leading-relaxed">{analytics.velocity.insight}</div>
                    </div>
                </div>
            </div>

            {/* Pain points */}
            {analytics.frustration.painPoints.length > 0 && (
                <div className="mt-6 pt-5 border-t border-[#1e1e22]">
                    <div className="text-[10px] font-mono text-zinc-600 mb-3 uppercase">Audience_Pain_Points</div>
                    <div className="flex flex-wrap gap-2">
                        {analytics.frustration.painPoints.map((p, i) => (
                            <span key={i} className="text-xs font-mono bg-red-950/30 text-red-400 border border-red-900/50 rounded px-2 py-1">! {p}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Tags */}
            {analytics.suggestedTags.length > 0 && (
                <div className="mt-5">
                    <div className="text-[10px] font-mono text-zinc-600 mb-3 uppercase">Suggested_Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                        {analytics.suggestedTags.slice(0, 15).map((tag, i) => (
                            <span key={i} className="text-[11px] font-mono bg-[#1e1e22] text-zinc-400 rounded px-2 py-0.5">{tag}</span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ channelId?: string }>;
}) {
    const session = await auth();
    const { channelId: selectedId } = await searchParams;

    if (!session?.user?.email) {
        redirect("/auth/signin");
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
        redirect("/auth/signin");
    }

    // Fetch all channels
    const allChannels = await getChannelsByUserId(user.id);
    
    // Select channel (by param or fallback to latest)
    const activeChannel = selectedId 
        ? allChannels.find((c: any) => c.id === selectedId) || allChannels[0]
        : allChannels[0];

    if (!activeChannel) {
        redirect("/onboarding");
    }

    const scans = await getChannelScans(activeChannel.id);

    // Aggregate stats
    const totalGaps = scans.reduce((s: number, scan: any) => {
        const result = scan.result as { gaps: GapItem[] } | null;
        return s + (result?.gaps?.length ?? 0);
    }, 0);

    return (
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 fade-up">
            {/* Channel Header Info */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#1e1e22] pb-6">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#1e1e22] text-zinc-400 rounded text-[10px] font-mono font-bold uppercase tracking-wider">
                        {activeChannel.role === "new_tuber" ? "project_new" : "project_existing"}
                    </div>
                    <h1 className="text-4xl font-extrabold text-white tracking-tight">{activeChannel.name}</h1>
                    <p className="text-zinc-500 text-sm max-w-xl">
                        {activeChannel.role === "new_tuber" 
                            ? `Computed strategy for a new channel in the [${activeChannel.category}] category focusing on [${activeChannel.topic}].`
                            : `Analyzing gap signals for YouTube handle [${activeChannel.youtubeChannelId}].`
                        }
                    </p>
                </div>

                <div className="flex items-center gap-4 border border-[#1e1e22] bg-[#111113] rounded-lg px-6 py-4">
                    <div className="text-left md:text-center pr-6 border-r border-[#1e1e22]">
                        <div className="text-2xl font-bold text-white leading-none mb-1">{scans.length}</div>
                        <div className="text-[10px] font-mono uppercase text-zinc-600 tracking-widest">Scans_Run</div>
                    </div>
                    <div className="text-left md:text-center">
                        <div className="text-2xl font-bold text-white leading-none mb-1">{totalGaps}</div>
                        <div className="text-[10px] font-mono uppercase text-zinc-600 tracking-widest">Gaps_Mined</div>
                    </div>
                </div>
            </div>

            <div className="mb-16">
                <FlashcardRoadmap
                    key={activeChannel.id}
                    category={activeChannel.category ?? "General"}
                    topic={activeChannel.topic ?? "YouTube Channel"}
                    theme={activeChannel.brandingData ? (activeChannel.brandingData as any).theme : "tech"}
                    channelId={activeChannel.id}
                    videoIdeas={(activeChannel as any).videoIdeas ?? []}
                />
            </div>

            {/* Scans Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-[#1e1e22] pb-3">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Scan History
                    </h2>
                    <div className="text-[10px] font-mono text-zinc-500 px-2 py-1 bg-[#1e1e22] rounded">
                        via GapTuber Extension
                    </div>
                </div>

                {scans.length === 0 ? (
                    <div className="text-center py-20 bg-[#111113] border border-[#1e1e22] rounded-xl flex flex-col items-center">
                        <div className="w-12 h-12 bg-[#1e1e22] border border-[#2a2a30] rounded flex items-center justify-center mb-5 text-xl">📡</div>
                        <h3 className="text-zinc-200 font-bold mb-2">Awaiting first scan data</h3>
                        <p className="text-zinc-500 text-sm mb-6 max-w-sm">Use the GapTuber extension on any YouTube channel to execute a new gap scan.</p>
                        <Link 
                            href="#" 
                            className="bg-white text-black px-5 py-2.5 rounded text-sm font-semibold hover:bg-zinc-200 transition-colors"
                        >
                            Extension Download
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {[...scans].reverse().map((scan) => {
                            const result = scan.result as { gaps: GapItem[]; overallOpportunity?: string; recommendedNiche?: string } | null;
                            const analytics = scan.analytics as ScanAnalytics | null;
                            if (!result?.gaps?.length) return null;

                            return (
                                <div key={scan.id}>
                                    <div className="mb-6">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className="text-xl font-bold text-white tracking-tight">
                                                query: "{scan.keyword}"
                                            </span>
                                            {result.recommendedNiche && (
                                                <span className="text-[10px] font-mono bg-[#111113] border border-[#1e1e22] text-zinc-400 rounded px-2 py-0.5">
                                                    niche: {result.recommendedNiche}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-mono text-zinc-600">
                                            <span>{new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}</span>
                                            <span>|</span>
                                            <span>FOUND {result.gaps.length} GAPS</span>
                                        </div>
                                    </div>

                                    {analytics && <AnalyticsPanel analytics={analytics} />}

                                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {result.gaps.map((gap, i) => (
                                            <GapCard key={i} gap={gap} rank={i + 1} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
