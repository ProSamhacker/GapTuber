"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, PlayCircle, Video, Users, Eye, Loader2, RefreshCw } from "lucide-react";
import type { VideoIdeaDB } from "@/db/schema";

interface VideoIdea {
    id: string;
    title: string;
    hook: string;
    format: string;
    duration: string;
    status: "ready" | "in-progress" | "locked";
}

function ViewPotentialBadge({ level }: { level: string }) {
    const colors: Record<string, string> = {
        high: "bg-violet-500/20 text-violet-300 border-violet-500/30",
        medium: "bg-blue-500/20 text-blue-300 border-blue-500/30",
        low: "bg-slate-500/20 text-slate-300 border-slate-500/30",
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[level] || colors["medium"]}`}>
            <Eye className="w-3 h-3" /> {level.toUpperCase()}
        </span>
    );
}

function mapBlueprintToIdeas(ideas: VideoIdeaDB[]): VideoIdea[] {
    return ideas.map((idea, i) => ({
        id: `idea-${i}`,
        title: idea.title,
        hook: idea.hook,
        format: idea.format,
        duration: idea.format.toLowerCase().includes("short") ? "5-8 mins" : "10-15 mins",
        status: i === 0 ? "ready" as const : i === 1 ? "in-progress" as const : "ready" as const,
    }));
}

interface FlashcardRoadmapProps {
    category: string;
    topic: string;
    theme: string;
    channelId: string;
    videoIdeas?: VideoIdeaDB[];
}

export default function FlashcardRoadmap({ category, topic, theme, channelId, videoIdeas: initialIdeas }: FlashcardRoadmapProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeChannelId = searchParams?.get("channelId") || channelId;

    const [videoIdeas, setVideoIdeas] = useState<VideoIdeaDB[]>(initialIdeas ?? []);
    const [isGenerating, setIsGenerating] = useState(false);

    const ideas = mapBlueprintToIdeas(videoIdeas);

    const handleGenerateScript = (idea: VideoIdea, index: number) => {
        const rawIdea = videoIdeas[index];
        const title = idea.title;
        const prompt = `Write a full, highly-detailed YouTube script for a ${idea.format} video titled: "${idea.title}".

Hook Idea: "${idea.hook}"
Target Audience: ${rawIdea?.targetAudience || "general audience"}
View Potential: ${rawIdea?.estimatedViewPotential || "high"}

**CRITICAL SCRIPT REQUIREMENTS:**
1. **Length**: The script must be scaled for a video that is roughly **5 to 15 minutes long** (adjust based on the depth of the topic).
2. **Pacing & Timestamps**: Break the script down into proper **10-15 second segments** (e.g., [0:00 - 0:15], [0:15 - 0:30]).
3. **Structure**: Organize the video into clear sections like "Scene 1: The Hook", "Scene 2: The Problem", etc., with descriptive names.
4. **FORMAT**: You MUST output the actual script using a **Markdown Table**. Do not use standard text paragraphs for the script body.
5. **Table Columns**: The table must have exactly these 4 columns:
   | Scene / Section | Timestamp | Visuals / B-Roll | Audio / Voiceover |

**Example of expected format:**
### Scene 1: The Hook (Retaining Viewers)
| Scene / Section | Timestamp | Visuals / B-Roll | Audio / Voiceover |
| :--- | :--- | :--- | :--- |
| Hook | 0:00 - 0:10 | Fast zoom into creator's face, text pop-up: "$10k/mo?" | "What if I told you that you could make ten grand a month..." |

Ensure the storytelling is highly engaging, high-retention, and ends with a strong Call-To-Action (CTA). Generate the complete script now in the table format requested.`;

        const botUrl = `/dashboard/bot?channelId=${activeChannelId}&title=${encodeURIComponent(title)}&prompt=${encodeURIComponent(prompt)}`;
        router.push(botUrl);
    };

    const handleGenerateIdeas = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch("/api/channel-creation", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, topic }),
            });

            if (!res.ok) throw new Error("Failed to generate ideas");

            const data = await res.json();
            if (data.videoIdeas?.length > 0) {
                setVideoIdeas(data.videoIdeas);

                // Persist to DB in background
                fetch("/api/channel-blueprint", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        channelId,
                        videoIdeas: data.videoIdeas,
                        contentStrategy: data.contentStrategy,
                        marketSnapshot: data.marketAnalysis,
                    }),
                }).catch(() => {}); // fire-and-forget
            }
        } catch (err) {
            console.error("Failed to generate video ideas:", err);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-violet-400" />
                        Your Content Roadmap
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        {videoIdeas.length > 0
                            ? <>Data-driven video concepts based on real YouTube market analysis for <span className="text-white font-medium">{topic}</span>.</>
                            : <>Generate AI-powered video ideas tailored for your <span className="text-white font-medium">{category}</span> channel about <span className="text-white font-medium">{topic}</span>.</>
                        }
                    </p>
                </div>
            </div>

            {ideas.length === 0 ? (
                <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/10 rounded-3xl">
                    <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <Sparkles className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-white font-bold mb-1">No video ideas yet</h3>
                    <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
                        Generate data-driven video concepts based on real YouTube market analysis, competitor gaps, and trending keywords.
                    </p>
                    <button
                        onClick={handleGenerateIdeas}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-violet-500 transition-all disabled:opacity-50 shadow-lg shadow-violet-500/20"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing YouTube Market...</>
                        ) : (
                            <><Sparkles className="w-4 h-4" /> Generate Video Ideas</>
                        )}
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-3 gap-6">
                        {ideas.slice(0, 6).map((idea, index) => (
                            <motion.div
                                key={idea.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative rounded-3xl p-6 border bg-white/[0.03] border-violet-500/30 hover:border-violet-500/50 hover:bg-white/[0.05] transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Video {index + 1}</span>
                                    {videoIdeas[index]?.estimatedViewPotential && (
                                        <ViewPotentialBadge level={videoIdeas[index].estimatedViewPotential} />
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-white leading-tight mb-3">
                                    {idea.title}
                                </h3>

                                <div className="space-y-4 mb-6">
                                    <div className="bg-black/20 rounded-xl p-3">
                                        <span className="block text-[10px] uppercase tracking-wider text-violet-400 mb-1 font-semibold">The Hook</span>
                                        <p className="text-xs text-slate-300 italic">&quot;{idea.hook}&quot;</p>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <Video className="w-3.5 h-3.5" />
                                            {idea.format}
                                        </div>
                                        {videoIdeas[index]?.targetAudience && (
                                            <div className="flex items-center gap-1.5">
                                                <Users className="w-3.5 h-3.5" />
                                                {videoIdeas[index].targetAudience}
                                            </div>
                                        )}
                                    </div>

                                    {videoIdeas[index]?.whyItWorks && (
                                        <p className="text-xs text-slate-500 leading-relaxed">{videoIdeas[index].whyItWorks}</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleGenerateScript(idea, index)}
                                    className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all bg-violet-600 text-white hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/20"
                                >
                                    <PlayCircle className="w-4 h-4" />
                                    Generate Script in AuraBot
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-center pt-4">
                        <button
                            onClick={handleGenerateIdeas}
                            disabled={isGenerating}
                            className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                            ) : (
                                <><RefreshCw className="w-4 h-4" /> Generate new ideas</>
                            )}
                        </button>
                    </div>
                </>
            )}

        </div>
    );
}
