import { NextRequest, NextResponse } from "next/server";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { auth } from "@/auth";
import { db } from "@/db";

import { getRandomYouTubeApiKey } from "@/lib/youtube-server";
import { scans } from "@/db/schema";
import { getUserByEmail, getChannelById, deductUserCredits } from "@/db/queries";
import {
    buildGapCandidates,
    computeVelocityScore,
    computeSaturationScore,
    computeFrustrationScore,
    computeEngagementScore,
    computeTrendMomentum,
    computeCompetitionScore,
    computeOptimalUploadSchedule,
    estimateRevenue,
    generateOptimalTags,
    VideoData,
    CommentData,
} from "@/lib/engine/scoring";
import { buildAnalysisPrompt } from "@/lib/engine/prompts";
import { GapOutputSchema } from "@/lib/engine/schemas";
import { buildAnalysisProvenance } from "@/lib/engine/provenance";
import { getChannelIdFromHandle, getRecentChannelVideos, getSearchResults, getTopComments } from "@/lib/youtube-server";
import { z } from "zod";

export const maxDuration = 60; // Vercel Hobby plan max for streaming/Next.js config

const WebAnalyzeRequestSchema = z.object({
    keyword: z.string().min(2).max(100).trim(),
    competitors: z.array(z.string()).min(1).max(3),
    channelId: z.string().uuid(), // The ID of the current GapTuber channel to save against
});



export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Rate limit: 10 messages per hour per user
        const { max, windowMs } = RATE_LIMITS.webAnalyze;
        const rl = await rateLimit(`web-analyze:${session.user.email}`, max, windowMs);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: `Rate limit exceeded. Max ${max} analysis/hour. Try again in ${Math.ceil(rl.resetMs / 60000)} min.` },
                { status: 429 }
            );
        }

        const body = await req.json();
        const parseResult = WebAnalyzeRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json({ error: "Invalid request data.", details: parseResult.error.flatten() }, { status: 400 });
        }

        const { keyword, competitors, channelId } = parseResult.data;
        const dbUser = await getUserByEmail(session.user.email);
        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        if (dbUser.credits < 1) {
            return NextResponse.json({ error: "Insufficient credits. Please upgrade your plan." }, { status: 402 });
        }

        const ownedChannel = await getChannelById(channelId);
        if (!ownedChannel || ownedChannel.userId !== dbUser.id) {
            return NextResponse.json({ error: "Channel not found" }, { status: 404 });
        }

        const apiKey = getRandomYouTubeApiKey();

        if (!apiKey) {
            return NextResponse.json({ error: "YouTube API Key is missing." }, { status: 500 });
        }

        // 1. Fetch YouTube Data
        let videos: VideoData[] = [];
        const comments: CommentData[] = [];
        let competitorsResolved = 0;
        
        for (const competitor of competitors) {
            const ytChannelId = await getChannelIdFromHandle(competitor, apiKey);
            if (ytChannelId) {
                const recentVideos = await getRecentChannelVideos(ytChannelId, apiKey, 10);
                if (recentVideos.length > 0) competitorsResolved += 1;
                videos = [...videos, ...recentVideos];
            }
        }

        // Deduplicate videos
        videos = Array.from(new Map(videos.map(v => [v.url, v])).values());

        const searchResults = await getSearchResults(keyword, apiKey, 15);

        // Fetch comments for the top 3 most viewed videos to compute frustration
        const topVideos = [...videos].sort((a, b) => b.views - a.views).slice(0, 3);
        for (const video of topVideos) {
            const videoId = video.url.split("v=")[1];
            if (videoId) {
                const videoComments = await getTopComments(videoId, apiKey, 20);
                comments.push(...videoComments.map(c => ({ ...c, videoUrl: video.url })));
            }
        }

        if (videos.length === 0 && searchResults.length === 0) {
            return NextResponse.json({ error: "Could not fetch any YouTube data for the provided inputs." }, { status: 404 });
        }

        // 2. Deterministic Scoring
        const evidencePool = [...comments]
            .map(comment => ({ ...comment, id: comment.id ?? crypto.randomUUID() }))
            .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
            .slice(0, 30);

        const candidates = buildGapCandidates({ keyword, videos, comments: evidencePool, searchResults });

        const velocityData = computeVelocityScore(videos);
        const saturationData = computeSaturationScore(searchResults);
        const frustrationData = computeFrustrationScore(evidencePool);
        const engagementData = computeEngagementScore(videos);
        const trendData = computeTrendMomentum(videos);
        const competitionData = computeCompetitionScore(searchResults);
        const scheduleData = computeOptimalUploadSchedule(videos);
        const suggestedTags = generateOptimalTags(keyword, videos, frustrationData.topKeywords);

        // Tier 2A: Extract competitor titles and verbatim pain points for LLM differentiation
        const competitorTitles = searchResults.map(r => r.title).filter(Boolean);
        const promptComments = evidencePool.map(comment => ({
            id: comment.id,
            text: comment.text.trim().slice(0, 300),
            likes: comment.likeCount ?? 0,
        }));
        const whyNowContext = `Sample collected now from the YouTube Data API: ${videos.length} competitor videos, ${searchResults.length} keyword search results, and ${evidencePool.length} top-level comments. Recent-performance score: ${trendData.score.toFixed(1)}/10 (${trendData.insight})`;
        const prompt = buildAnalysisPrompt(keyword, candidates, competitorTitles, promptComments, whyNowContext);

        // 3. AI Refinement
        const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3].filter(Boolean) as string[];
        if (keys.length === 0) {
            return NextResponse.json({ error: "Groq API keys not configured." }, { status: 503 });
        }

        let rawAiText = "";
        let aiSuccess = false;
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const activeKey of shuffledKeys) {
            try {
                const groq = createGroq({ apiKey: activeKey });
                const result = await generateText({
                    model: groq("openai/gpt-oss-120b"),
                    messages: [
                        { role: "system", content: "You are a JSON API. Respond with only valid JSON, no markdown." },
                        { role: "user", content: prompt },
                    ],
                    maxOutputTokens: 1500,
                    temperature: 0.2,
                });
                rawAiText = result.text;
                aiSuccess = true;
                break;
            } catch (err) {
                console.warn("[Web Analyze AI Error]", err);
            }
        }

        if (!aiSuccess) {
            return NextResponse.json({ error: "AI service error." }, { status: 503 });
        }

        // 4. Parse Output
        let parsedOutput: unknown;
        try {
            const start = rawAiText.indexOf("{");
            const end = rawAiText.lastIndexOf("}");
            if (start === -1 || end <= start) throw new Error("No JSON object found");
            parsedOutput = JSON.parse(rawAiText.slice(start, end + 1));
        } catch {
            return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 502 });
        }

        const validationResult = GapOutputSchema.safeParse(parsedOutput);
        if (!validationResult.success) {
            return NextResponse.json({ error: "AI output schema validation failed." }, { status: 502 });
        }

        let scanResult = validationResult.data;

        const avgViews = videos.length > 0 ? videos.reduce((s, v) => s + v.views, 0) / videos.length : 10000;
        const revenueEstimate = estimateRevenue(avgViews, keyword);

        const provenance = buildAnalysisProvenance({
            competitorsRequested: competitors.length,
            competitorsResolved,
            videos: videos.length,
            comments: evidencePool.length,
            searchResults: searchResults.length,
            dataConfidence: candidates[0]?.scores.confidence ?? 0,
        });

        const analyticsPayload = {
            velocity: { score: velocityData.score, insight: velocityData.insight, weeklyGrowthRate: velocityData.weeklyGrowthRate },
            saturation: { score: saturationData.score, insight: saturationData.insight, competitionLevel: saturationData.competitionLevel },
            frustration: { score: frustrationData.score, topKeywords: frustrationData.topKeywords, painPoints: frustrationData.painPoints, sentimentBreakdown: frustrationData.sentimentBreakdown },
            engagement: { score: engagementData.score, avgLikeRate: engagementData.avgLikeRate, avgCommentRate: engagementData.avgCommentRate },
            trend: { score: trendData.score, trend: trendData.trend, insight: trendData.insight },
            competition: { score: competitionData.score, difficulty: competitionData.difficulty, insight: competitionData.insight },
            uploadSchedule: { bestDay: scheduleData.bestDay, bestHour: scheduleData.bestHour, insight: scheduleData.insight },
            revenueEstimate: { low: revenueEstimate.low, mid: revenueEstimate.mid, high: revenueEstimate.high },
            suggestedTags: suggestedTags.slice(0, 20),
            provenance,
        };

        const structuredReasons = [
            { type: "velocity", label: "Recent performance delta", value: (velocityData.weeklyGrowthRate ?? 0) > 0 ? "+" + Math.round(velocityData.weeklyGrowthRate ?? 0) + "%" : Math.round(velocityData.weeklyGrowthRate ?? 0) + "%", source: "youtube_video_sample" },
            { type: "saturation", label: "Competition", value: saturationData.competitionLevel ?? "Unknown", source: "saturation" },
            { type: "sample", label: "Evidence sample", value: `${videos.length} videos · ${evidencePool.length} comments`, source: "youtube_data_api" }
        ];

        scanResult = {
            ...scanResult,
            gaps: scanResult.gaps.map((gap, index) => {
                const candidate = candidates[index] ?? candidates[0];
                const evidenceComments = (gap.evidenceComments ?? [])
                    .map(evidence => evidencePool.find(comment => comment.id === evidence.commentId))
                    .filter((comment): comment is typeof evidencePool[number] => Boolean(comment))
                    .map(comment => ({ commentId: comment.id, text: comment.text, likes: comment.likeCount ?? 0 }));

                return {
                    ...gap,
                    id: crypto.randomUUID(),
                    gapScore: candidate?.scores.compositeScore ?? 0,
                    confidence: candidate?.scores.confidence ?? 0,
                    evidenceComments,
                    quantitativeReasons: structuredReasons,
                };
            })
        };

        // Charge only after the model response is parsed, validated, and grounded.
        await deductUserCredits(dbUser.id, 1, "Web Competitor Analysis");

        // 6. Save to DB
        const scanId = crypto.randomUUID();
        try {
                await db.insert(scans).values({
                    id: scanId,
                    userId: dbUser.id,
                    channelId,
                    keyword,
                    competitors,
                    rawData: {
                        videoCount: videos.length,
                        commentCount: comments.length,
                        searchResultCount: searchResults.length,
                        candidateScores: candidates.map((c) => ({ title: c.title, score: c.scores.compositeScore })),
                    },
                    result: scanResult,
                    analytics: analyticsPayload,
                });
        } catch (dbError) {
            console.error("[Web Analyze DB Error]", dbError);
        }

        return NextResponse.json({
            success: true,
            keyword,
            gaps: scanResult.gaps,
            overallOpportunity: scanResult.overallOpportunity,
            recommendedNiche: scanResult.recommendedNiche,
            analytics: analyticsPayload,
            scanId,
        });

    } catch (error) {
        console.error("[Web Analyze Error]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
