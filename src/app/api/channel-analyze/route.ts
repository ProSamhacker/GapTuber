import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { decode } from "next-auth/jwt";
import { auth } from "@/auth";
import {
    computeChannelMetrics,
    computeKeywordUniqueness,
    computeSEOScore,
    computeGrowthScore,
    buildChannelAnalysisPrompt,
    type VideoInput,
} from "@/lib/engine/channel-prompts";
import { ChannelAnalysisSchema } from "@/lib/engine/channel-schemas";
import { fetchFullChannelData } from "@/lib/engine/youtube-api";
import { z } from "zod";

export const runtime = "edge";

// ─── CORS ─────────────────────────────────────────────────────────────────────

function getCorsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get("origin") ?? "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Token",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    };
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

// ─── Input Schema ─────────────────────────────────────────────────────────────

const RequestSchema = z.object({
    channelUrl: z.string().url("Must be a valid YouTube channel URL"),
});

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const cors = getCorsHeaders(req);

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "YouTube API key not configured" },
            { status: 503, headers: cors }
        );
    }

    // Parse input
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", details: parsed.error.flatten() },
            { status: 400, headers: cors }
        );
    }

    const { channelUrl } = parsed.data;

    // ── Fetch full channel data from YouTube API ─────────────────────────────
    let channelInfo: Awaited<ReturnType<typeof fetchFullChannelData>>["channelInfo"];
    let ytVideos: Awaited<ReturnType<typeof fetchFullChannelData>>["videos"];

    try {
        const result = await fetchFullChannelData(apiKey, channelUrl, 100);
        channelInfo = result.channelInfo;
        ytVideos = result.videos;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";

        if (msg === "QUOTA_EXCEEDED") {
            return NextResponse.json(
                { error: "YouTube API quota exceeded. Resets at midnight Pacific Time." },
                { status: 429, headers: cors }
            );
        }
        if (msg.includes("not found")) {
            return NextResponse.json(
                { error: "Channel not found. Check the URL is a valid YouTube channel." },
                { status: 404, headers: cors }
            );
        }

        console.error("[YouTube API Error]", msg);
        return NextResponse.json(
            { error: "Failed to fetch channel data.", message: msg },
            { status: 502, headers: cors }
        );
    }

    if (!ytVideos.length) {
        return NextResponse.json(
            { error: "No videos found for this channel." },
            { status: 404, headers: cors }
        );
    }

    // ── Convert to VideoInput (channel-prompts compatible) ───────────────────
    const videoInputs: VideoInput[] = ytVideos.map((v) => ({
        title: v.title,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        uploadDate: v.uploadDate,
        channel: v.channel,
        duration: v.duration,
    }));

    // ── Deterministic Pre-scoring ────────────────────────────────────────────
    const metrics = computeChannelMetrics(videoInputs);

    // Top 20 by views for the Groq prompt
    const topVideos = [...videoInputs].sort((a, b) => b.views - a.views);

    // Engagement metrics from the YouTube API data (not available from scraping)
    const totalLikes = ytVideos.reduce((s, v) => s + v.likes, 0);
    const totalComments = ytVideos.reduce((s, v) => s + v.comments, 0);
    const avgLikesPerVideo = Math.round(totalLikes / Math.max(ytVideos.length, 1));
    const avgCommentsPerVideo = Math.round(totalComments / Math.max(ytVideos.length, 1));

    // ── Build Groq Prompt ────────────────────────────────────────────────────
    const basePrompt = buildChannelAnalysisPrompt(
        channelInfo.channelName,
        channelUrl,
        metrics,
        topVideos
    );

    // Inject richer stats that only API provides
    const enrichedPrompt = basePrompt.replace(
        "COMPUTED DATA SIGNALS",
        `CHANNEL STATS (from YouTube API — ${ytVideos.length} videos analyzed):
- Subscribers: ${channelInfo.subscriberCount.toLocaleString()}
- Total Videos: ${channelInfo.totalVideoCount.toLocaleString()} (analyzed: ${ytVideos.length})
- Avg Likes/Video: ${avgLikesPerVideo.toLocaleString()}
- Avg Comments/Video: ${avgCommentsPerVideo.toLocaleString()}

COMPUTED DATA SIGNALS`
    );

    // ── Groq AI Analysis ─────────────────────────────────────────────────────
    const keys = [
        process.env.GROQ_API_KEY,
        process.env.GROQ_API_KEY_2,
        process.env.GROQ_API_KEY_3
    ].filter(Boolean) as string[];

    if (keys.length === 0) {
        return NextResponse.json(
            { error: "Groq API keys not configured" },
            { status: 503, headers: cors }
        );
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
                        content: "You are a JSON API. Respond only with valid JSON matching the exact schema provided. No markdown, no explanation.",
                    },
                    { role: "user", content: enrichedPrompt },
                ],
                maxOutputTokens: 2500,
                temperature: 0.2,
            });
            rawText = result.text;
            success = true;
            break;
        } catch (aiErr: any) {
            lastError = aiErr;
            console.warn("[Key Rotation ChannelAnalyze] Key failed, trying next...");
        }
    }

    if (!success) {
        console.error("[Channel AI Error] All keys exhausted.", lastError);
        return NextResponse.json(
            { error: "AI service temporarily unavailable. Rate limits exceeded." },
            { status: 503, headers: cors }
        );
    }

    // ── Parse + Validate JSON ────────────────────────────────────────────────
    let parsedOutput: unknown;
    try {
        const start = rawText.indexOf("{");
        const end = rawText.lastIndexOf("}");
        if (start === -1 || end <= start) throw new Error("No JSON found");
        parsedOutput = JSON.parse(rawText.slice(start, end + 1));
    } catch {
        console.error("[Channel Parse Error] Raw text:", rawText.slice(0, 600));
        return NextResponse.json(
            { error: "AI response format error. Please retry." },
            { status: 502, headers: cors }
        );
    }

    const validation = ChannelAnalysisSchema.safeParse(parsedOutput);
    if (!validation.success) {
        console.error("[Channel Schema Error]", JSON.stringify(validation.error.flatten(), null, 2));
        console.error("[Channel Schema] Raw parsed:", JSON.stringify(parsedOutput).slice(0, 800));
        return NextResponse.json(
            { error: "Schema validation failed. Please retry.", details: validation.error.flatten() },
            { status: 502, headers: cors }
        );
    }

    const analysis = validation.data;

    // ── Post-process: all 4 scores computed deterministically — never from AI ──
    const enrichedKeywords = analysis.keywords.map((kw) => {
        const seo = computeSEOScore(kw.keyword);
        const growth = computeGrowthScore(
            metrics.viewVelocity,
            avgLikesPerVideo,
            avgCommentsPerVideo,
            metrics.averageViews,
            metrics.recentTrend
        );
        const uniqueness = computeKeywordUniqueness(kw.keyword, metrics.topicUniqueness, metrics.totalVideos);
        const gap = Math.round(seo * 0.35 + growth * 0.30 + uniqueness * 0.35);
        return {
            ...kw,
            seoScore: seo,
            growthScore: growth,
            uniquenessScore: uniqueness,
            gapScore: Math.min(100, gap),
        };
    });

    // ── Validate competitor handles ───────────────────────────────────────────
    const validCompetitors = analysis.competitors
        .filter((c) => /^@[a-zA-Z0-9_.\-]{2,}$/.test(c.handle))
        .map((c) => ({ ...c, aiSuggested: true }));

    // ── Optional: persist to DB ───────────────────────────────────────────────
    try {
        const session = await auth();
        let userEmail = session?.user?.email;
        if (!userEmail) {
            const token = req.headers.get("X-Session-Token");
            if (token) {
                const salts = [
                    "__Secure-authjs.session-token",
                    "authjs.session-token",
                    "__Secure-next-auth.session-token",
                    "next-auth.session-token"
                ];
                for (const salt of salts) {
                    try {
                        const decoded = await decode({ token, secret: process.env.AUTH_SECRET!, salt });
                        if (decoded?.email) {
                            userEmail = decoded.email;
                            break;
                        }
                    } catch {
                        // ignore
                    }
                }
            }
        }
        if (userEmail) {
            console.log(`[ChannelAnalyze] ${userEmail} → ${channelInfo.channelName} (${ytVideos.length} videos)`);
        }
    } catch { /* non-blocking */ }

    // Compute additional analytics
    const avgLikeRate = avgLikesPerVideo / Math.max(metrics.averageViews, 1);
    const avgCommentRate = avgCommentsPerVideo / Math.max(metrics.averageViews, 1);

    // Revenue estimation
    const estimatedMonthlyViews = metrics.averageViews * metrics.postsPerWeek * 4;
    const cpmRange = analysis.niche.toLowerCase().includes("finance") ? { low: 12, high: 45 }
        : analysis.niche.toLowerCase().includes("tech") || analysis.niche.toLowerCase().includes("ai") ? { low: 8, high: 25 }
            : analysis.niche.toLowerCase().includes("programming") || analysis.niche.toLowerCase().includes("code") ? { low: 8, high: 22 }
                : { low: 3, high: 12 };

    const monetizedViewRate = 0.45;
    const creatorShare = 0.55;
    const monthlyRevenueLow = Math.round((estimatedMonthlyViews * monetizedViewRate / 1000) * cpmRange.low * creatorShare);
    const monthlyRevenueHigh = Math.round((estimatedMonthlyViews * monetizedViewRate / 1000) * cpmRange.high * creatorShare);

    // Upload schedule analysis
    const uploadDays: Record<string, number> = {};
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (const v of ytVideos) {
        const day = DAYS[new Date(v.uploadDate).getDay()];
        uploadDays[day] = (uploadDays[day] ?? 0) + 1;
    }
    const bestUploadDay = Object.entries(uploadDays).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tuesday";

    // Top performing video analysis
    const topPerformers = [...ytVideos]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
        .map(v => ({
            title: v.title,
            views: v.views,
            likes: v.likes,
            likeRate: v.views > 0 ? ((v.likes / v.views) * 100).toFixed(2) : "0",
            uploadDate: v.uploadDate,
        }));

    return NextResponse.json(
        {
            success: true,
            channel: {
                name: channelInfo.channelName,
                url: channelUrl,
                handle: channelInfo.handle,
                subscribers: channelInfo.subscriberCount,
                totalVideos: channelInfo.totalVideoCount,
                description: channelInfo.description,
            },
            metrics: {
                viewVelocity: metrics.viewVelocity,
                uploadConsistency: metrics.uploadConsistency,
                hitRate: metrics.hitRate,
                recentTrend: metrics.recentTrend,
                postsPerWeek: metrics.postsPerWeek,
                averageViews: metrics.averageViews,
                totalVideos: ytVideos.length,
                avgLikesPerVideo,
                avgCommentsPerVideo,
                avgLikeRate: parseFloat((avgLikeRate * 100).toFixed(3)),
                avgCommentRate: parseFloat((avgCommentRate * 100).toFixed(4)),
                engagementScore: metrics.engagementScore,
            },
            revenue: {
                estimatedMonthlyViews,
                monthlyRevenueLow,
                monthlyRevenueHigh,
                cpmRange,
                note: "Estimates based on niche CPM benchmarks and 45% monetized view rate",
            },
            uploadSchedule: {
                bestDay: bestUploadDay,
                dayDistribution: uploadDays,
                currentFrequency: `${metrics.postsPerWeek} videos/week`,
            },
            topPerformers,
            niche: analysis.niche,
            summary: analysis.summary,
            keywords: enrichedKeywords,
            competitors: validCompetitors,
            topPatterns: analysis.topPatterns,
            contentOpportunityGaps: analysis.contentOpportunityGaps,
            growthActions: analysis.growthActions ?? [],
        },
        { status: 200, headers: cors }
    );
}
