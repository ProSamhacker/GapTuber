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
    title: "Dashboard — AuraIQ",
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
    return (
        <div className="flex items-center gap-3 mb-2">
            <span className="text-xs text-slate-500 w-24 flex-shrink-0 font-medium">{label}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${score}%` }}
                />
            </div>
            <span className="text-xs font-bold text-slate-400 w-8 text-right tabular-nums">{score}%</span>
        </div>
    );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({
    value, label, icon, color,
}: { value: string; label: string; icon: string; color: string }) {
    return (
        <div className={`rounded-2xl p-4 text-center border ${color} bg-white/[0.03]`}>
            <div className="text-xl mb-1">{icon}</div>
            <div className="text-2xl font-black text-white tabular-nums leading-none">{value}</div>
            <div className="text-xs text-slate-500 mt-1 font-medium">{label}</div>
        </div>
    );
}

// ─── Gap Card ─────────────────────────────────────────────────────────────────

function GapCard({ gap, rank }: { gap: GapItem; rank: number }) {
    const scoreColor = gap.gapScore >= 8
        ? "border-violet-500/40 bg-violet-500/5"
        : gap.gapScore >= 6
            ? "border-blue-500/30 bg-blue-500/5"
            : gap.gapScore >= 4
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-white/5 bg-white/[0.02]";

    const badgeColor = gap.gapScore >= 8
        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
        : gap.gapScore >= 6
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            : gap.gapScore >= 4
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "bg-white/5 text-slate-400 border border-white/10";

    return (
        <div className={`rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-violet-500/10 overflow-hidden ${scoreColor}`}>
            {/* Card header */}
            <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gap #{rank}</span>
                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${badgeColor}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    {gap.gapScore}/10
                </div>
            </div>

            <div className="p-5 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-white text-sm leading-snug">{gap.title}</h3>

                {/* Reasoning */}
                <p className="text-xs text-slate-500 leading-relaxed">{gap.reasoning}</p>

                {/* Hook */}
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
                    <div className="text-xs font-semibold text-violet-400 mb-1">🎣 Hook</div>
                    <p className="text-xs text-slate-300 italic">&ldquo;{gap.hook}&rdquo;</p>
                </div>

                {/* Target Audience */}
                {gap.targetAudience && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2">
                        <div className="text-xs font-semibold text-blue-400 mb-1">👥 Target Audience</div>
                        <p className="text-xs text-slate-300">{gap.targetAudience}</p>
                    </div>
                )}

                {/* Content Outline */}
                {gap.contentOutline && gap.contentOutline.length > 0 && (
                    <div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">📋 Content Outline</div>
                        <div className="space-y-1.5">
                            {gap.contentOutline.map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                    <span className="w-4 h-4 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Competitor Weakness */}
                {gap.competitorWeakness && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                        <div className="text-xs font-semibold text-red-400 mb-1">🎯 Competitor Weakness</div>
                        <p className="text-xs text-slate-300">{gap.competitorWeakness}</p>
                    </div>
                )}

                {/* Format + Monetization */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
                        <div className="text-xs font-semibold text-slate-600 mb-1">📹 Format</div>
                        <p className="text-xs text-slate-300">{gap.format}</p>
                    </div>
                    <div className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2">
                        <div className="text-xs font-semibold text-slate-600 mb-1">💰 Angle</div>
                        <p className="text-xs text-slate-300">{gap.monetizationAngle}</p>
                    </div>
                </div>

                {/* SEO Tips */}
                {gap.seoTips && gap.seoTips.length > 0 && (
                    <div>
                        <div className="text-xs font-semibold text-slate-500 mb-2">🔍 SEO Tips</div>
                        <div className="space-y-1">
                            {gap.seoTips.map((tip, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                    <span className="text-emerald-400 flex-shrink-0">✓</span>
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
        { value: analytics.velocity.score.toFixed(1), label: "Velocity", icon: "📈", color: "border-blue-500/20" },
        { value: analytics.saturation.score.toFixed(1), label: "Opportunity", icon: "🎯", color: "border-emerald-500/20" },
        { value: analytics.frustration.score.toFixed(1), label: "Frustration", icon: "😤", color: "border-orange-500/20" },
        { value: analytics.trend.score.toFixed(1), label: "Trend", icon: "📊", color: "border-violet-500/20" },
    ];

    return (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span>📡</span> Gap Signal Metrics
                <span className="text-xs font-normal text-slate-600 ml-1">(higher = stronger opportunity)</span>
            </h3>

            {/* Score cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {metrics.map(m => (
                    <MetricCard key={m.label} {...m} />
                ))}
            </div>

            {/* Score bars */}
            <div className="mb-4">
                <ScoreBar label="Velocity" score={Math.round(analytics.velocity.score * 10)} color="bg-gradient-to-r from-blue-600 to-blue-400" />
                <ScoreBar label="Opportunity" score={Math.round(analytics.saturation.score * 10)} color="bg-gradient-to-r from-emerald-600 to-emerald-400" />
                <ScoreBar label="Frustration" score={Math.round(analytics.frustration.score * 10)} color="bg-gradient-to-r from-orange-600 to-orange-400" />
                <ScoreBar label="Trend" score={Math.round(analytics.trend.score * 10)} color="bg-gradient-to-r from-violet-600 to-violet-400" />
                <ScoreBar label="Competition" score={Math.round(analytics.competition.score * 10)} color="bg-gradient-to-r from-cyan-600 to-cyan-400" />
                <ScoreBar label="Engagement" score={Math.round(analytics.engagement.score * 10)} color="bg-gradient-to-r from-pink-600 to-pink-400" />
            </div>

            {/* Insight row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Upload schedule */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <div className="text-xs font-semibold text-slate-500 mb-1">📅 Best Upload Window</div>
                    <div className="text-sm font-bold text-white">{analytics.uploadSchedule.bestDay} · {analytics.uploadSchedule.bestHour}:00 UTC</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{analytics.uploadSchedule.insight}</div>
                </div>
                {/* Velocity insight */}
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                    <div className="text-xs font-semibold text-slate-500 mb-1">📈 Velocity Signal</div>
                    <div className="text-xs text-slate-300 leading-relaxed">{analytics.velocity.insight}</div>
                </div>
            </div>

            {/* Pain points */}
            {analytics.frustration.painPoints.length > 0 && (
                <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">😤 Audience Pain Points</div>
                    <div className="flex flex-wrap gap-1.5">
                        {analytics.frustration.painPoints.map((p, i) => (
                            <span key={i} className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2.5 py-0.5">⚡ {p}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggested Tags */}
            {analytics.suggestedTags.length > 0 && (
                <div className="mt-3">
                    <div className="text-xs font-semibold text-slate-500 mb-2">🏷️ Suggested Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                        {analytics.suggestedTags.slice(0, 12).map((tag, i) => (
                            <span key={i} className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2.5 py-0.5">{tag}</span>
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
    const allGaps = scans.flatMap((s: any) => (s.result as { gaps: GapItem[] } | null)?.gaps ?? []);
    const avgGapScore = allGaps.length > 0
        ? (allGaps.reduce((s: number, g: any) => s + g.gapScore, 0) / allGaps.length).toFixed(1)
        : "—";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            {/* Channel Header Info */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 text-violet-300 rounded-full text-[10px] font-bold uppercase tracking-wider border border-violet-500/20">
                        {activeChannel.role === "new_tuber" ? "🚀 New Channel Project" : "📺 Existing Channel"}
                    </div>
                    <h1 className="text-4xl font-extrabold text-white">{activeChannel.name}</h1>
                    <p className="text-slate-500 text-sm max-w-xl">
                        {activeChannel.role === "new_tuber" 
                            ? `Creating a brand new channel in the ${activeChannel.category} niche focusing on ${activeChannel.topic}.`
                            : `Analyzing and growing the YouTube handle ${activeChannel.youtubeChannelId}.`
                        }
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-3">
                    <div className="text-center px-4 border-r border-white/5">
                        <div className="text-xl font-bold text-white">{scans.length}</div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Scans</div>
                    </div>
                    <div className="text-center px-4">
                        <div className="text-xl font-bold text-white">{totalGaps}</div>
                        <div className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Gaps</div>
                    </div>
                </div>
            </div>

            <div className="mb-12">
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
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        📡 Recent Gap Signals
                    </h2>
                    <div className="text-xs text-violet-400 font-medium px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                        🔗 Use Browser Extension to scan
                    </div>
                </div>

                {scans.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📡</div>
                        <h3 className="text-white font-bold mb-1">No scans recorded for this channel</h3>
                        <p className="text-slate-500 text-sm mb-6">Open the YouTube channel in your browser and use the AuraIQ extension.</p>
                        <Link 
                            href="#" 
                            className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/15 transition-all"
                        >
                            Install Extension &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {[...scans].reverse().map((scan) => {
                            const result = scan.result as { gaps: GapItem[]; overallOpportunity?: string; recommendedNiche?: string } | null;
                            const analytics = scan.analytics as ScanAnalytics | null;
                            if (!result?.gaps?.length) return null;

                            return (
                                <div key={scan.id} className="animate-fade-in">
                                    <div className="flex items-start justify-between mb-5">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <span className="text-2xl font-bold text-white tracking-tight">
                                                    &ldquo;{scan.keyword}&rdquo;
                                                </span>
                                                {result.recommendedNiche && (
                                                    <span className="text-xs bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-full px-2.5 py-0.5 font-medium">
                                                        {result.recommendedNiche}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span>{new Date(scan.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                                                <span>·</span>
                                                <span>{result.gaps.length} gaps found</span>
                                            </div>
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
