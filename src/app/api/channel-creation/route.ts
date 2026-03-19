import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import {
    computeMarketIntelligence,
    generateOptimalTags,
    type VideoData,
    type SearchResult,
    type CommentData,
} from "@/lib/engine/scoring";

export const maxDuration = 60;

const YT_BASE = "https://www.googleapis.com/youtube/v3";

// ─── YouTube Search for Market Data ──────────────────────────────────────────

async function searchYouTubeForTopic(
    apiKey: string,
    topic: string,
    maxResults = 25
): Promise<{ videos: VideoData[]; searchResults: SearchResult[] }> {
    // Step 1: Search for video IDs
    const searchUrl = `${YT_BASE}/search?part=snippet&q=${encodeURIComponent(topic)}&type=video&order=relevance&maxResults=${maxResults}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);

    if (!searchRes.ok) {
        const err = await searchRes.json() as { error?: { code: number; message: string } };
        if (err.error?.code === 403) throw new Error("QUOTA_EXCEEDED");
        throw new Error(`YouTube search failed: ${err.error?.message ?? searchRes.statusText}`);
    }

    const searchData = await searchRes.json() as {
        items?: Array<{
            id: { videoId: string };
            snippet: { title: string; channelTitle: string; publishedAt: string };
        }>;
    };

    const videoIds = (searchData.items ?? []).map(item => item.id.videoId);
    if (videoIds.length === 0) return { videos: [], searchResults: [] };

    // Step 2: Get full video stats
    const statsUrl = `${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(",")}&key=${apiKey}`;
    const statsRes = await fetch(statsUrl);

    if (!statsRes.ok) {
        return { videos: [], searchResults: [] };
    }

    const statsData = await statsRes.json() as {
        items?: Array<{
            id: string;
            snippet: { title: string; channelTitle: string; publishedAt: string; tags?: string[]; description?: string };
            statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
            contentDetails: { duration?: string };
        }>;
    };

    const videos: VideoData[] = [];
    const searchResults: SearchResult[] = [];

    for (const item of (statsData.items ?? [])) {
        const views = parseInt(item.statistics.viewCount ?? "0");
        const likes = parseInt(item.statistics.likeCount ?? "0");
        const comments = parseInt(item.statistics.commentCount ?? "0");

        videos.push({
            title: item.snippet.title,
            views,
            likes,
            comments,
            uploadDate: item.snippet.publishedAt,
            url: `https://youtube.com/watch?v=${item.id}`,
            channel: item.snippet.channelTitle,
            duration: item.contentDetails.duration,
            tags: item.snippet.tags,
            description: item.snippet.description?.slice(0, 200),
        });

        searchResults.push({
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            views,
            likes,
            uploadDate: item.snippet.publishedAt,
        });
    }

    // Step 3: Try to get channel subscriber counts for competition analysis
    const uniqueChannels = [...new Set(videos.map(v => v.channel))];
    try {
        const channelSearchUrl = `${YT_BASE}/search?part=snippet&q=${encodeURIComponent(topic)}&type=channel&maxResults=10&key=${apiKey}`;
        const channelRes = await fetch(channelSearchUrl);
        if (channelRes.ok) {
            const channelData = await channelRes.json() as {
                items?: Array<{ id: { channelId: string }; snippet: { title: string } }>;
            };
            const channelIds = (channelData.items ?? []).map(c => c.id.channelId);
            if (channelIds.length > 0) {
                const channelStatsUrl = `${YT_BASE}/channels?part=statistics&id=${channelIds.join(",")}&key=${apiKey}`;
                const channelStatsRes = await fetch(channelStatsUrl);
                if (channelStatsRes.ok) {
                    const csData = await channelStatsRes.json() as {
                        items?: Array<{
                            snippet?: { title: string };
                            statistics: { subscriberCount?: string };
                        }>;
                    };
                    const subCounts = (csData.items ?? []).map(c => parseInt(c.statistics.subscriberCount ?? "0"));
                    // Assign subscriber counts to matching search results
                    for (let i = 0; i < Math.min(searchResults.length, subCounts.length); i++) {
                        searchResults[i].subscriberCount = subCounts[i] || 0;
                    }
                }
            }
        }
    } catch {
        // Non-critical: competition analysis still works without exact sub counts
    }

    return { videos, searchResults };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { category?: string; topic?: string };
        const { category = "general", topic = "" } = body;

        if (!topic || topic.length < 2) {
            return NextResponse.json({ error: "Topic is required (min 2 chars)" }, { status: 400 });
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        const geminiKey = process.env.GEMINI_API_KEY;

        if (!geminiKey) {
            return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
        }

        // ── Step 1: Fetch YouTube market data ────────────────────────────────
        let videos: VideoData[] = [];
        let searchResults: SearchResult[] = [];

        if (apiKey) {
            try {
                const ytData = await searchYouTubeForTopic(apiKey, `${topic} ${category}`, 25);
                videos = ytData.videos;
                searchResults = ytData.searchResults;
            } catch (err) {
                console.warn("[Channel Creation] YouTube API error, proceeding with AI only:", err);
            }
        }

        // ── Step 2: Compute market intelligence ──────────────────────────────
        const market = computeMarketIntelligence(topic, videos, searchResults);

        // ── Step 3: Generate optimal tags ────────────────────────────────────
        const suggestedTags = generateOptimalTags(topic, videos, market.trendingKeywords);

        // ── Step 4: Build AI prompt with real market data ────────────────────
        const topVideoSummary = videos
            .sort((a, b) => b.views - a.views)
            .slice(0, 10)
            .map((v, i) => `  ${i + 1}. "${v.title}" by ${v.channel} — ${v.views.toLocaleString()} views`)
            .join("\n");

        const competitorChannels = [...new Set(videos.map(v => v.channel))].slice(0, 8).join(", ");

        const prompt = `You are an elite YouTube channel creation strategist with deep market knowledge.

TASK: Analyze the "${topic}" niche in the "${category}" category and generate a comprehensive channel blueprint.

REAL YOUTUBE MARKET DATA (from YouTube API — treat as ground truth):
- Videos analyzed: ${videos.length}
- Demand Score: ${market.demandScore}/100
- Competition: ${market.difficultyRating} (${market.topCompetitorChannels} competing channels)
- Growth Trajectory: ${market.growthTrajectory}
- Avg Competitor Views: ${market.avgCompetitorViews.toLocaleString()}
- Avg Competitor Subscribers: ${market.avgCompetitorSubs.toLocaleString()}
- Trending Keywords: ${market.trendingKeywords.join(", ") || "none detected"}
- Content Gaps Found: ${market.contentGapCount}
- Upload Frequency Benchmark: ${market.uploadFrequencyBenchmark} videos/week
- Market Verdict: ${market.overallVerdict}

TOP PERFORMING VIDEOS IN THIS NICHE:
${topVideoSummary || "  No video data available"}

ACTIVE COMPETITOR CHANNELS:
${competitorChannels || "No competitor data available"}

AUDIENCE PAIN POINTS DETECTED:
${market.audiencePainPoints.length > 0 ? market.audiencePainPoints.join(", ") : "No specific pain points detected from comments"}

YOUR TASK — Generate ALL of the following:

1. CHANNEL NAMES: Suggest exactly 5 unique, modern, memorable YouTube channel names for a "${topic}" channel.
   Rules:
   - Names must be ORIGINAL and NOT already used by existing popular YouTube channels
   - Names should be 1-3 words, catchy, and brandable
   - Avoid generic patterns like "[Topic] TV", "[Topic] Hub", "[Topic] Channel"
   - Think modern startup-style naming: invented words, clever wordplay, abstract concepts
   - Each name should have a different vibe (tech, playful, authoritative, minimalist, bold)
   - Include a brief reasoning for each name

2. VIDEO IDEAS: Generate exactly 5 high-potential video ideas that:
   - Are specifically aligned to the "${topic}" niche (NOT generic YouTube advice)
   - Address the actual market gaps and audience pain points found above
   - Have specific, clickable titles (not templates)
   - Include a compelling hook (first 10 seconds of the video)
   - Include recommended format (tutorial, deep dive, comparison, etc.)
   - Are ordered by estimated view potential (highest first)

3. SUB-NICHES: Identify 3 promising sub-niches within "${topic}" that have:
   - Lower competition than the main topic
   - Growing search demand
   - Clear audience need

4. CONTENT STRATEGY: A brief 3-sentence content strategy for the first month.

RESPOND WITH ONLY THIS JSON:
{
  "channelNames": [
    { "name": "string", "reasoning": "string", "vibe": "string" }
  ],
  "videoIdeas": [
    {
      "title": "string",
      "hook": "string",
      "format": "string",
      "whyItWorks": "string",
      "estimatedViewPotential": "high|medium|low",
      "targetAudience": "string"
    }
  ],
  "subNiches": [
    { "name": "string", "opportunity": "string", "competition": "Low|Medium|High" }
  ],
  "contentStrategy": "string",
  "channelDescription": "string"
}`;

        const keys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3
        ].filter(Boolean) as string[];

        if (keys.length === 0) {
            return NextResponse.json({ error: "Groq API keys not configured" }, { status: 503 });
        }

        let rawText: string = "";
        let success = false;
        let lastError: any = null;

        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const activeKey of shuffledKeys) {
            try {
                const groq = createGroq({ apiKey: activeKey });
                const result = await generateText({
                    model: groq("llama-3.3-70b-versatile"),
                    messages: [
                        {
                            role: "system",
                            content: "You are a JSON API. Respond ONLY with valid JSON matching the exact schema provided. No markdown fences, no explanation text.",
                        },
                        { role: "user", content: prompt },
                    ],
                    maxOutputTokens: 3000,
                    temperature: 0.7,
                });
                rawText = result.text;
                success = true;
                break; // If successful, exit the retry loop
            } catch (aiErr: any) {
                lastError = aiErr;
                console.warn("[Key Rotation] Key failed or rate-limited, trying next...");
            }
        }

        if (!success) {
            console.error("[Channel Creation AI Error] All keys exhausted.", lastError);
            return NextResponse.json({ error: "AI service temporarily unavailable (Rate limit). Please try again later." }, { status: 503 });
        }

        // ── Step 5: Parse AI response ────────────────────────────────────────
        let aiOutput: {
            channelNames: Array<{ name: string; reasoning: string; vibe: string }>;
            videoIdeas: Array<{
                title: string;
                hook: string;
                format: string;
                whyItWorks: string;
                estimatedViewPotential: string;
                targetAudience: string;
            }>;
            subNiches: Array<{ name: string; opportunity: string; competition: string }>;
            contentStrategy: string;
            channelDescription: string;
        };

        try {
            const start = rawText.indexOf("{");
            const end = rawText.lastIndexOf("}");
            if (start === -1 || end <= start) throw new Error("No JSON found");
            aiOutput = JSON.parse(rawText.slice(start, end + 1));
        } catch {
            console.error("[Channel Creation Parse Error]", rawText.slice(0, 500));
            return NextResponse.json({ error: "AI response format error. Please retry." }, { status: 502 });
        }

        // ── Step 6: Assemble response ────────────────────────────────────────
        return NextResponse.json({
            success: true,
            topic,
            category,
            channelNames: aiOutput.channelNames ?? [],
            channelDescription: aiOutput.channelDescription ?? "",
            videoIdeas: aiOutput.videoIdeas ?? [],
            subNiches: aiOutput.subNiches ?? [],
            contentStrategy: aiOutput.contentStrategy ?? "",
            suggestedTags,
            marketAnalysis: {
                demandScore: market.demandScore,
                saturationLevel: market.saturationLevel,
                growthTrajectory: market.growthTrajectory,
                difficultyRating: market.difficultyRating,
                topCompetitorChannels: market.topCompetitorChannels,
                avgCompetitorViews: market.avgCompetitorViews,
                avgCompetitorSubs: market.avgCompetitorSubs,
                contentGapCount: market.contentGapCount,
                uploadFrequencyBenchmark: market.uploadFrequencyBenchmark,
                trendingKeywords: market.trendingKeywords,
                bestSubNiches: market.bestSubNiches,
                overallVerdict: market.overallVerdict,
            },
            estimatedFirstYearViews: market.estimatedFirstYearViews,
            revenueEstimate: market.revenueEstimate,
            velocityInsight: market.velocityInsight,
            saturationInsight: market.saturationInsight,
            trendInsight: market.trendInsight,
            competitionInsight: market.competitionInsight,
        });

    } catch (err) {
        console.error("[CHANNEL_CREATION_ERROR]", err);
        return NextResponse.json({ error: "Failed to generate channel blueprint." }, { status: 500 });
    }
}
