"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Database, Play, Video, Users, Eye, Loader2, RefreshCw } from "lucide-react";
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
    const isHigh = level.toLowerCase() === "high";
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase border ${isHigh ? "bg-emerald-600/10 text-emerald-400 border-emerald-600/20" : "bg-[#1e1e22] text-zinc-400 border-[#2a2a30]"}`}>
            {isHigh && <Eye className="w-3 h-3" />}
            {level} POTENTIAL
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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                        <Database className="w-5 h-5 text-emerald-400" />
                        Content Roadmap
                    </h2>
                    <p className="text-zinc-500 text-sm">
                        {videoIdeas.length > 0
                            ? <>Data-driven concepts computed for <span className="text-zinc-300 font-mono text-xs bg-[#1e1e22] px-1.5 py-0.5 rounded">{topic}</span>.</>
                            : <>Generate calculated video ideas based on <span className="text-zinc-300 font-mono text-xs bg-[#1e1e22] px-1.5 py-0.5 rounded">{category}</span> trends.</>
                        }
                    </p>
                </div>
            </div>

            {ideas.length === 0 ? (
                <div className="text-center py-16 bg-[#111113] border border-[#1e1e22] rounded-xl">
                    <div className="w-12 h-12 bg-[#1e1e22] rounded flex items-center justify-center mx-auto mb-4 border border-[#2a2a30]">
                        <Database className="w-5 h-5 text-zinc-400" />
                    </div>
                    <h3 className="text-zinc-200 font-bold mb-1">No concepts generated</h3>
                    <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">
                        Compute data-driven video concepts based on real YouTube market analysis, competitor gaps, and trends.
                    </p>
                    <button
                        onClick={handleGenerateIdeas}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded text-sm font-semibold hover:bg-emerald-500 transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Computing...</>
                        ) : (
                            <><Play className="w-4 h-4 fill-current" /> Compute Video Ideas</>
                        )}
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-3 gap-4">
                        {ideas.slice(0, 6).map((idea, index) => (
                            <motion.div
                                key={idea.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex flex-col bg-[#111113] border border-[#1e1e22] hover:border-[#2a2a30] rounded-xl p-5 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-mono font-bold text-zinc-600 uppercase">Video_0{index + 1}</span>
                                    {videoIdeas[index]?.estimatedViewPotential && (
                                        <ViewPotentialBadge level={videoIdeas[index].estimatedViewPotential} />
                                    )}
                                </div>

                                <h3 className="text-white font-bold leading-snug mb-4">
                                    {idea.title}
                                </h3>

                                <div className="space-y-4 mb-6 flex-1">
                                    <div className="bg-[#0c0c0e] border border-[#1e1e22] rounded p-3">
                                        <span className="block text-[10px] font-mono text-zinc-600 mb-1.5 uppercase">Hook_Prompt</span>
                                        <p className="text-[13px] text-zinc-300 italic">"{idea.hook}"</p>
                                    </div>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                                            <Video className="w-3.5 h-3.5 text-zinc-400" />
                                            <span className="bg-[#1e1e22] px-1.5 py-0.5 rounded">{idea.format}</span>
                                        </div>
                                        {videoIdeas[index]?.targetAudience && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
                                                <Users className="w-3.5 h-3.5 text-zinc-400" />
                                                <span className="bg-[#1e1e22] px-1.5 py-0.5 rounded text-left truncate max-w-[120px]" title={videoIdeas[index].targetAudience}>{videoIdeas[index].targetAudience}</span>
                                            </div>
                                        )}
                                    </div>

                                    {videoIdeas[index]?.whyItWorks && (
                                        <div className="pt-2 border-t border-[#1e1e22]">
                                            <p className="text-[10px] font-mono text-zinc-600 mb-1 uppercase">Reasoning</p>
                                            <p className="text-xs text-zinc-500 leading-relaxed">{videoIdeas[index].whyItWorks}</p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleGenerateScript(idea, index)}
                                    className="w-full py-2.5 rounded bg-[#0c0c0e] border border-[#1e1e22] hover:border-emerald-500/50 hover:bg-emerald-600/5 flex items-center justify-center gap-2 text-xs font-semibold text-zinc-300 hover:text-emerald-300 transition-colors"
                                >
                                    <Play className="w-3.5 h-3.5 fill-current" />
                                    Launch Script Gen
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    <div className="flex justify-center pt-2">
                        <button
                            onClick={handleGenerateIdeas}
                            disabled={isGenerating}
                            className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> RECOMPUTING...</>
                            ) : (
                                <><RefreshCw className="w-3 h-3" /> [ RERUN_COMPUTATION ]</>
                            )}
                        </button>
                    </div>
                </>
            )}

        </div>
    );
}
