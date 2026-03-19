import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { auth } from "@/auth";
import { decode } from "next-auth/jwt";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { getUserByEmail, getChannelsByUserId } from "@/db/queries";
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
} from "@/lib/engine/scoring";
import { buildAnalysisPrompt } from "@/lib/engine/prompts";
import { AnalyzeRequestSchema, GapOutputSchema } from "@/lib/engine/schemas";

export const runtime = "edge";

// CORS: reflect origin for credentialed requests (Access-Control-Allow-Origin: * won't work with credentials)
function getCorsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get("origin") ?? "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Session-Token, X-Session-Cookie",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    };
}

// Handle preflight requests from Chrome Extension
export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

// Rate limiter: 10 requests per hour per IP
let ratelimit: Ratelimit | null = null;

function getRatelimit() {
    if (!ratelimit) {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(100, "1 h"),
            analytics: false,
            prefix: "ai-gap-radar:analyze",
        });
    }
    return ratelimit;
}

function getClientIp(req: NextRequest): string {
    return (
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        req.headers.get("x-real-ip") ??
        "unknown"
    );
}

export async function POST(req: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIp(req);
        const { success, limit, remaining, reset } = await getRatelimit().limit(ip);

        if (!success) {
            return NextResponse.json(
                {
                    error: "Rate limit exceeded",
                    message: "You can run 10 scans per hour. Please try again later.",
                    retryAfter: Math.ceil((reset - Date.now()) / 1000),
                },
                {
                    status: 429,
                    headers: {
                        ...getCorsHeaders(req),
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    },
                }
            );
        }

        // Parse and validate input
        let body: unknown;
        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON", message: "Request body must be valid JSON." },
                { status: 400 }
            );
        }

        const parseResult = AnalyzeRequestSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    message: "Invalid request data.",
                    details: parseResult.error.flatten(),
                },
                { status: 400 }
            );
        }

        const input = parseResult.data;

        // Phase 1: Deterministic scoring engine
        const candidates = buildGapCandidates({
            keyword: input.keyword,
            videos: input.videos,
            comments: input.comments,
            searchResults: input.searchResults,
        });

        // Phase 2: AI refinement via Groq
        const prompt = buildAnalysisPrompt(input.keyword, candidates);

        const keys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3
        ].filter(Boolean) as string[];

        if (keys.length === 0) {
            return NextResponse.json(
                { error: "Groq API keys not configured", message: "Missing API keys." },
                { status: 503, headers: getCorsHeaders(req) }
            );
        }


        let rawAiText: string = "";
        let aiSuccess = false;
        let lastError: any = null;

        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const activeKey of shuffledKeys) {
            try {
                const groq = createGroq({ apiKey: activeKey });
                const model = groq("llama-3.3-70b-versatile");
                const result = await generateText({
                    model,
                    messages: [
                        {
                            role: "system",
                            content: "You are a JSON API. Respond with only valid JSON, no markdown, no explanation.",
                        },
                        { role: "user", content: prompt },
                    ],
                    maxOutputTokens: 1500,
                    temperature: 0.3,
                });
                rawAiText = result.text;
                aiSuccess = true;
                break;
            } catch (aiError: any) {
                lastError = aiError;
                console.warn("[Key Rotation Analyze] Key failed, trying next...");
            }
        }

        if (!aiSuccess) {
            console.error("[AI Error] All keys exhausted.", lastError);
            return NextResponse.json(
                {
                    error: "AI service error",
                    message: "The AI service is temporarily unavailable. Please try again.",
                },
                { status: 503, headers: getCorsHeaders(req) }
            );
        }

        // Parse and validate AI JSON output
        let parsedOutput: unknown;
        try {
            // Bracket-match to find the outermost JSON object (handles extra text/markdown)
            const start = rawAiText.indexOf("{");
            const end = rawAiText.lastIndexOf("}");
            if (start === -1 || end === -1 || end <= start) {
                throw new Error("No JSON object found");
            }
            const jsonStr = rawAiText.slice(start, end + 1);
            parsedOutput = JSON.parse(jsonStr);
        } catch {
            console.error("[Parse Error] Raw AI text:", rawAiText.slice(0, 400));
            return NextResponse.json(
                {
                    error: "AI response error",
                    message: "The AI returned an invalid response format. Please retry.",
                },
                { status: 502, headers: getCorsHeaders(req) }
            );
        }

        const validationResult = GapOutputSchema.safeParse(parsedOutput);
        if (!validationResult.success) {
            console.error("[Schema Error]", JSON.stringify(validationResult.error.flatten()));
            console.error("[Raw AI]", rawAiText.slice(0, 400));
            return NextResponse.json(
                {
                    error: "AI output validation failed",
                    message: "The AI response did not match the expected schema. Please retry.",
                },
                { status: 502 }
            );
        }

        const scanResult = validationResult.data;

        // Persist scan to DB — try standard auth() first, then forward cookie to /api/auth/session
        try {
            const session = await auth();
            let userEmail = session?.user?.email;

            // Fallback: extension sends raw cookie value in X-Session-Cookie header.
            // We forward it to /api/auth/session so NextAuth's JWE decryption runs server-side.
            if (!userEmail) {
                const cookieValue = req.headers.get("X-Session-Cookie");
                if (cookieValue) {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
                    const cookieNames = ["authjs.session-token", "__Secure-authjs.session-token"];
                    for (const name of cookieNames) {
                        try {
                            const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
                                headers: { Cookie: `${name}=${cookieValue}` },
                            });
                            if (sessionRes.ok) {
                                const sessionData = await sessionRes.json() as { user?: { email?: string } };
                                if (sessionData?.user?.email) {
                                    userEmail = sessionData.user.email;
                                    break;
                                }
                            }
                        } catch { /* try next cookie name */ }
                    }
                }
            }

            console.log("[Auth Debug] email resolved:", userEmail ?? "null");

            if (userEmail) {
                const user = await getUserByEmail(userEmail);
                if (user) {
                    const userChannels = await getChannelsByUserId(user.id);
                    if (userChannels.length > 0) {
                        const targetChannelId = userChannels[0].id;

                        // Compute analytics for DB storage
                        const velocityData2 = computeVelocityScore(input.videos);
                        const saturationData2 = computeSaturationScore(input.searchResults);
                        const frustrationData2 = computeFrustrationScore(input.comments);
                        const engagementData2 = computeEngagementScore(input.videos);
                        const trendData2 = computeTrendMomentum(input.videos);
                        const competitionData2 = computeCompetitionScore(input.searchResults);
                        const scheduleData2 = computeOptimalUploadSchedule(input.videos);
                        const suggestedTags2 = generateOptimalTags(input.keyword, input.videos, frustrationData2.topKeywords);
                        const avgViews2 = input.videos.length > 0
                            ? input.videos.reduce((s, v) => s + v.views, 0) / input.videos.length
                            : 10000;
                        const revenueEstimate2 = estimateRevenue(avgViews2, input.keyword);

                        await db.insert(scans).values({
                            userId: user.id,
                            channelId: targetChannelId,
                            keyword: input.keyword,
                            competitors: input.competitors,
                        rawData: {
                            videoCount: input.videos.length,
                            commentCount: input.comments.length,
                            searchResultCount: input.searchResults.length,
                            candidateScores: candidates.map((c) => ({
                                title: c.title,
                                score: c.scores.compositeScore,
                            })),
                        },
                        result: scanResult,
                        analytics: {
                            velocity: { score: velocityData2.score, insight: velocityData2.insight, weeklyGrowthRate: velocityData2.weeklyGrowthRate },
                            saturation: { score: saturationData2.score, insight: saturationData2.insight, competitionLevel: saturationData2.competitionLevel },
                            frustration: { score: frustrationData2.score, topKeywords: frustrationData2.topKeywords, painPoints: frustrationData2.painPoints },
                            engagement: { score: engagementData2.score, avgLikeRate: engagementData2.avgLikeRate, avgCommentRate: engagementData2.avgCommentRate },
                            trend: { score: trendData2.score, trend: trendData2.trend, insight: trendData2.insight },
                            competition: { score: competitionData2.score, difficulty: competitionData2.difficulty, insight: competitionData2.insight },
                            uploadSchedule: { bestDay: scheduleData2.bestDay, bestHour: scheduleData2.bestHour, insight: scheduleData2.insight },
                            revenueEstimate: { low: revenueEstimate2.low, mid: revenueEstimate2.mid, high: revenueEstimate2.high },
                            suggestedTags: suggestedTags2.slice(0, 20),
                            },
                        });
                    }
                }
            }
        } catch (dbError) {
            // Log but don't fail the request — user still gets results
            console.error("[DB Error] Failed to save scan:", dbError);
        }

        // Compute enhanced analytics for the response
        const velocityData = computeVelocityScore(input.videos);
        const saturationData = computeSaturationScore(input.searchResults);
        const frustrationData = computeFrustrationScore(input.comments);
        const engagementData = computeEngagementScore(input.videos);
        const trendData = computeTrendMomentum(input.videos);
        const competitionData = computeCompetitionScore(input.searchResults);
        const scheduleData = computeOptimalUploadSchedule(input.videos);
        const suggestedTags = generateOptimalTags(input.keyword, input.videos, frustrationData.topKeywords);

        // Estimate revenue for top gap
        const topGap = scanResult.gaps[0];
        const avgViews = input.videos.length > 0
            ? input.videos.reduce((s, v) => s + v.views, 0) / input.videos.length
            : 10000;
        const revenueEstimate = estimateRevenue(avgViews, input.keyword);

        return NextResponse.json(
            {
                success: true,
                keyword: input.keyword,
                gaps: scanResult.gaps,
                overallOpportunity: scanResult.overallOpportunity,
                recommendedNiche: scanResult.recommendedNiche,
                analytics: {
                    velocity: {
                        score: velocityData.score,
                        insight: velocityData.insight,
                        weeklyGrowthRate: velocityData.weeklyGrowthRate,
                    },
                    saturation: {
                        score: saturationData.score,
                        insight: saturationData.insight,
                        competitionLevel: saturationData.competitionLevel,
                    },
                    frustration: {
                        score: frustrationData.score,
                        topKeywords: frustrationData.topKeywords,
                        painPoints: frustrationData.painPoints,
                        sentimentBreakdown: frustrationData.sentimentBreakdown,
                    },
                    engagement: {
                        score: engagementData.score,
                        avgLikeRate: engagementData.avgLikeRate,
                        avgCommentRate: engagementData.avgCommentRate,
                    },
                    trend: {
                        score: trendData.score,
                        trend: trendData.trend,
                        insight: trendData.insight,
                    },
                    competition: {
                        score: competitionData.score,
                        difficulty: competitionData.difficulty,
                        insight: competitionData.insight,
                    },
                    uploadSchedule: {
                        bestDay: scheduleData.bestDay,
                        bestHour: scheduleData.bestHour,
                        insight: scheduleData.insight,
                    },
                    revenueEstimate,
                    suggestedTags: suggestedTags.slice(0, 20),
                },
                meta: {
                    videoCount: input.videos.length,
                    commentCount: input.comments.length,
                    searchResultCount: input.searchResults.length,
                    candidatesEvaluated: candidates.length,
                    confidence: candidates[0]?.scores.confidence ?? 0,
                },
            },
            {
                status: 200,
                headers: {
                    ...getCorsHeaders(req),
                    "X-RateLimit-Remaining": remaining.toString(),
                },
            }
        );
    } catch (error) {
        console.error("[Analyze Error]", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                message: "An unexpected error occurred. Please try again.",
            },
            { status: 500, headers: getCorsHeaders(req) }
        );
    }
}
