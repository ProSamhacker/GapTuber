"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { completeNewTuberOnboarding } from "../actions";
import {
    Loader2, CheckCircle2, Wand2, Youtube, Sparkles, Hash,
    TrendingUp, BarChart3, Target, Zap, Users, Globe,
    ArrowRight, Star, Trophy, Flame, Shield, Eye
} from "lucide-react";

// ─── Full Category List ──────────────────────────────────────────────────────

const CATEGORIES = [
    { value: "tech", label: "Technology", icon: "💻" },
    { value: "ai", label: "AI & Machine Learning", icon: "🤖" },
    { value: "programming", label: "Programming", icon: "⌨️" },
    { value: "gaming", label: "Gaming", icon: "🎮" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "finance", label: "Finance & Crypto", icon: "💰" },
    { value: "entertainment", label: "Entertainment", icon: "🎬" },
    { value: "health", label: "Health & Fitness", icon: "💪" },
    { value: "business", label: "Business & SaaS", icon: "📈" },
    { value: "science", label: "Science", icon: "🔬" },
    { value: "lifestyle", label: "Lifestyle", icon: "✨" },
    { value: "music", label: "Music & Audio", icon: "🎵" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChannelName {
    name: string;
    reasoning: string;
    vibe: string;
}

interface VideoIdea {
    title: string;
    hook: string;
    format: string;
    whyItWorks: string;
    estimatedViewPotential: string;
    targetAudience: string;
}

interface SubNiche {
    name: string;
    opportunity: string;
    competition: string;
}

interface MarketAnalysis {
    demandScore: number;
    saturationLevel: string;
    growthTrajectory: string;
    difficultyRating: string;
    topCompetitorChannels: number;
    avgCompetitorViews: number;
    avgCompetitorSubs: number;
    contentGapCount: number;
    uploadFrequencyBenchmark: number;
    trendingKeywords: string[];
    bestSubNiches: string[];
    overallVerdict: string;
}

interface BlueprintData {
    channelNames: ChannelName[];
    channelDescription: string;
    videoIdeas: VideoIdea[];
    subNiches: SubNiche[];
    contentStrategy: string;
    suggestedTags: string[];
    marketAnalysis: MarketAnalysis;
    estimatedFirstYearViews: { low: number; mid: number; high: number };
    revenueEstimate: { low: number; mid: number; high: number };
}

// ─── Helper Components ────────────────────────────────────────────────────────

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (score / 100) * circumference;
    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                    <circle cx="40" cy="40" r="36" stroke={color} strokeWidth="6" fill="none"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-white">{score}</span>
                </div>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{label}</span>
        </div>
    );
}

function DifficultyBadge({ level }: { level: string }) {
    const colors: Record<string, string> = {
        "Easy": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        "Moderate": "bg-amber-500/20 text-amber-300 border-amber-500/30",
        "Hard": "bg-orange-500/20 text-orange-300 border-orange-500/30",
        "Very Hard": "bg-red-500/20 text-red-300 border-red-500/30",
    };
    const icons: Record<string, React.ReactNode> = {
        "Easy": <Shield className="w-3 h-3" />,
        "Moderate": <Target className="w-3 h-3" />,
        "Hard": <Flame className="w-3 h-3" />,
        "Very Hard": <Zap className="w-3 h-3" />,
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colors[level] || colors["Moderate"]}`}>
            {icons[level] || icons["Moderate"]} {level}
        </span>
    );
}

function ViewPotentialBadge({ level }: { level: string }) {
    const colors: Record<string, string> = {
        high: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[level] || colors["medium"]}`}>
            <Eye className="w-3 h-3" /> {level.toUpperCase()} POTENTIAL
        </span>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NewTuberPage() {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState("");
    const [topic, setTopic] = useState("");
    const [selectedChannelName, setSelectedChannelName] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStage, setGenerationStage] = useState(0);
    const [error, setError] = useState("");
    const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError("");
        setGenerationStage(1);

        try {
            // Simulate progress stages while API works
            const progressTimer = setInterval(() => {
                setGenerationStage(prev => Math.min(prev + 1, 4));
            }, 2500);

            const res = await fetch("/api/channel-creation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, topic }),
            });

            clearInterval(progressTimer);

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to generate blueprint");
            }

            const data = await res.json();
            setBlueprint(data);
            setGenerationStage(5);

            // Auto-select first channel name
            if (data.channelNames?.length > 0) {
                setSelectedChannelName(data.channelNames[0].name);
            }

            setTimeout(() => {
                setIsGenerating(false);
                setStep(2);
            }, 800);

        } catch (err) {
            setIsGenerating(false);
            setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setGenerationStage(0);
        }
    };

    const STAGES = [
        { label: "Searching YouTube market data...", icon: Globe },
        { label: "Running competition analysis...", icon: BarChart3 },
        { label: "Generating channel names & branding...", icon: Sparkles },
        { label: "Creating aligned video ideas...", icon: Youtube },
        { label: "Finalizing your blueprint...", icon: CheckCircle2 },
    ];

    return (
        <div className="max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
                {/* ─── Step 1: Input Form ─────────────────────────────────── */}
                {step === 1 && !isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-8 md:p-12 border border-slate-200 rounded-3xl shadow-sm"
                    >
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Let&apos;s Build Your Channel</h2>
                            <p className="text-slate-600">Tell us what you want to create. Our AI will analyze the YouTube market and engineer the perfect foundation.</p>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">What&apos;s your niche?</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.value}
                                            type="button"
                                            onClick={() => setCategory(cat.value)}
                                            className={`p-3 text-left border-2 rounded-xl transition-all ${
                                                category === cat.value
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-500/10"
                                                    : "border-slate-200 hover:border-emerald-300 text-slate-700"
                                            }`}
                                        >
                                            <span className="text-lg mr-2">{cat.icon}</span>
                                            <span className="text-sm font-medium">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">What&apos;s the specific topic?</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Building home lab servers, AI coding tools, Minimalist desk setups"
                                    className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-lg"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="button"
                                disabled={!category || !topic || topic.length < 2}
                                onClick={handleGenerate}
                                className="w-full py-5 bg-gradient-to-r from-emerald-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                            >
                                <Wand2 className="w-5 h-5" />
                                Analyze Market & Generate Blueprint
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ─── Loading: Real Progress ─────────────────────────────── */}
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white p-12 border border-slate-200 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]"
                    >
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-emerald-100 rounded-full animate-pulse" />
                            <div className="absolute inset-0 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            <Wand2 className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-bounce" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Analyzing &ldquo;{topic}&rdquo; Market...</h3>
                        <p className="text-slate-500 mb-6">Scanning real YouTube data for your niche</p>
                        <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
                            <motion.div
                                className="bg-gradient-to-r from-emerald-600 to-indigo-600 h-2.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(generationStage * 20, 100)}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                        <div className="space-y-3 text-slate-500 font-medium">
                            {STAGES.map((stage, i) => {
                                const Icon = stage.icon;
                                const active = generationStage > i;
                                return (
                                    <p key={i} className={`flex items-center justify-center gap-2 transition-all ${active ? "text-emerald-600" : "opacity-40"}`}>
                                        {active ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                        {stage.label}
                                    </p>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* ─── Step 2: Results ────────────────────────────────────── */}
                {step === 2 && !isGenerating && blueprint && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Market Analysis Panel */}
                        <div className="bg-[#0a0a0f] p-8 border border-white/10 rounded-3xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 via-indigo-500 to-purple-600" />

                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20 mb-3">
                                        <TrendingUp className="w-3 h-3" /> Market Intelligence Report
                                    </div>
                                    <h2 className="text-2xl font-bold text-white mb-2">&ldquo;{topic}&rdquo; — YouTube Market Analysis</h2>
                                    <p className="text-slate-400 text-sm max-w-xl">{blueprint.marketAnalysis.overallVerdict}</p>
                                </div>
                                <DifficultyBadge level={blueprint.marketAnalysis.difficultyRating} />
                            </div>

                            {/* Score Rings */}
                            <div className="flex flex-wrap justify-center gap-6 mb-8">
                                <ScoreRing score={blueprint.marketAnalysis.demandScore} label="Demand" color="#8b5cf6" />
                                <ScoreRing
                                    score={blueprint.marketAnalysis.saturationLevel === "Low" ? 80 : blueprint.marketAnalysis.saturationLevel === "Medium" ? 50 : 25}
                                    label="Opportunity"
                                    color="#10b981"
                                />
                                <ScoreRing
                                    score={blueprint.marketAnalysis.growthTrajectory === "accelerating" ? 85 : blueprint.marketAnalysis.growthTrajectory === "stable" ? 50 : 20}
                                    label="Growth"
                                    color="#3b82f6"
                                />
                                <ScoreRing score={blueprint.marketAnalysis.contentGapCount * 10} label="Content Gaps" color="#f59e0b" />
                            </div>

                            {/* Market Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-xl font-black text-white">{blueprint.marketAnalysis.topCompetitorChannels}</div>
                                    <div className="text-xs text-slate-500 mt-1">Competitors</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-xl font-black text-white">{(blueprint.marketAnalysis.avgCompetitorViews / 1000).toFixed(0)}K</div>
                                    <div className="text-xs text-slate-500 mt-1">Avg Views</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-xl font-black text-white">{blueprint.marketAnalysis.uploadFrequencyBenchmark}/wk</div>
                                    <div className="text-xs text-slate-500 mt-1">Upload Benchmark</div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                                    <div className="text-xl font-black text-white">${blueprint.revenueEstimate.low}-${blueprint.revenueEstimate.high}</div>
                                    <div className="text-xs text-slate-500 mt-1">Est. Year 1 Revenue</div>
                                </div>
                            </div>

                            {/* Estimated Views */}
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                <div className="text-xs font-bold text-emerald-300 mb-2 flex items-center gap-2">
                                    <BarChart3 className="w-3 h-3" /> Estimated First Year Views
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-slate-400">Conservative: <strong className="text-white">{blueprint.estimatedFirstYearViews.low.toLocaleString()}</strong></span>
                                    <span className="text-emerald-300">Expected: <strong className="text-white">{blueprint.estimatedFirstYearViews.mid.toLocaleString()}</strong></span>
                                    <span className="text-slate-400">Optimistic: <strong className="text-white">{blueprint.estimatedFirstYearViews.high.toLocaleString()}</strong></span>
                                </div>
                            </div>

                            {/* Trending Keywords */}
                            {blueprint.marketAnalysis.trendingKeywords.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-xs font-bold text-slate-400 mb-2">🔥 Trending Keywords</div>
                                    <div className="flex flex-wrap gap-2">
                                        {blueprint.marketAnalysis.trendingKeywords.map((kw, i) => (
                                            <span key={i} className="text-xs bg-white/5 text-slate-300 border border-white/10 rounded-full px-3 py-1">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Channel Name Selection */}
                        <div className="bg-white p-8 border border-slate-200 rounded-3xl shadow-sm">
                            <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-500" /> Choose Your Channel Name
                            </h3>
                            <p className="text-slate-500 text-sm mb-6">AI-generated unique names for your &ldquo;{topic}&rdquo; channel</p>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {blueprint.channelNames.map((cn, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setSelectedChannelName(cn.name)}
                                        className={`p-4 text-left border-2 rounded-xl transition-all ${
                                            selectedChannelName === cn.name
                                                ? "border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-500/10"
                                                : "border-slate-200 hover:border-emerald-300"
                                        }`}
                                    >
                                        <div className="font-bold text-slate-900 text-lg mb-1">{cn.name}</div>
                                        <div className="text-xs text-emerald-500 font-semibold mb-1">{cn.vibe}</div>
                                        <div className="text-xs text-slate-500 leading-relaxed">{cn.reasoning}</div>
                                    </button>
                                ))}
                            </div>

                            {/* Channel Description */}
                            {blueprint.channelDescription && (
                                <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="text-xs font-bold text-slate-600 mb-2">📝 AI Generated Description</div>
                                    <p className="text-sm text-slate-600 leading-relaxed">{blueprint.channelDescription}</p>
                                </div>
                            )}

                            {/* Tags */}
                            <div className="mt-4">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-2">
                                    <Hash className="w-4 h-4" /> Optimized Tags
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {blueprint.suggestedTags.slice(0, 15).map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-semibold">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Video Ideas — Aligned to Topic */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Youtube className="w-5 h-5 text-red-500" /> Your First Videos (AI-Powered Roadmap)
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {blueprint.videoIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-emerald-500 hover:shadow-lg transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                {idx + 1}
                                            </div>
                                            <ViewPotentialBadge level={idea.estimatedViewPotential} />
                                        </div>

                                        <h4 className="font-bold text-slate-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors text-sm">
                                            {idea.title}
                                        </h4>

                                        <div className="bg-slate-50 rounded-lg p-3 mb-3 border border-slate-100">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hook</div>
                                            <p className="text-xs text-slate-600 italic">&ldquo;{idea.hook}&rdquo;</p>
                                        </div>

                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <span className="font-semibold text-slate-700">Format:</span> {idea.format}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Users className="w-3 h-3" /> {idea.targetAudience}
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-400 mt-3 leading-relaxed">{idea.whyItWorks}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sub-Niches */}
                        {blueprint.subNiches.length > 0 && (
                            <div className="bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-500" /> Promising Sub-Niches
                                </h3>
                                <div className="grid md:grid-cols-3 gap-3">
                                    {blueprint.subNiches.map((sn, i) => (
                                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="font-semibold text-slate-900 mb-1">{sn.name}</div>
                                            <div className="text-xs text-slate-500 mb-2">{sn.opportunity}</div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                sn.competition === "Low" ? "bg-emerald-100 text-emerald-700" :
                                                sn.competition === "Medium" ? "bg-amber-100 text-amber-700" :
                                                "bg-red-100 text-red-700"
                                            }`}>
                                                {sn.competition} Competition
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content Strategy */}
                        {blueprint.contentStrategy && (
                            <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 p-6 border border-emerald-200 rounded-3xl">
                                <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-emerald-600" /> First Month Strategy
                                </h3>
                                <p className="text-sm text-slate-700 leading-relaxed">{blueprint.contentStrategy}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <form action={completeNewTuberOnboarding} className="pt-4">
                            <input type="hidden" name="category" value={category} />
                            <input type="hidden" name="topic" value={topic} />
                            <input type="hidden" name="channelName" value={selectedChannelName} />
                            <input type="hidden" name="theme" value="default" />
                            <input type="hidden" name="videoIdeas" value={JSON.stringify(blueprint?.videoIdeas ?? [])} />
                            <input type="hidden" name="contentStrategy" value={blueprint?.contentStrategy ?? ""} />
                            <input type="hidden" name="marketSnapshot" value={JSON.stringify(blueprint?.marketAnalysis ?? {})} />

                            <button
                                type="submit"
                                disabled={!selectedChannelName}
                                className="w-full py-5 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Save &ldquo;{selectedChannelName || "Select a Name"}&rdquo; & Enter Dashboard
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
