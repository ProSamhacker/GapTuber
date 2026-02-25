import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { auth } from "@/auth";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { getUserByEmail } from "@/db/queries";
import { buildGapCandidates } from "@/lib/engine/scoring";
import { buildAnalysisPrompt } from "@/lib/engine/prompts";
import { AnalyzeRequestSchema, GapOutputSchema } from "@/lib/engine/schemas";

export const runtime = "edge";

// Rate limiter: 10 requests per hour per IP
let ratelimit: Ratelimit | null = null;

function getRatelimit() {
    if (!ratelimit) {
        ratelimit = new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(10, "1 h"),
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

        const groq = createGroq({ apiKey: process.env.GROQ_API_KEY! });

        let rawAiText: string;
        try {
            const model = groq("llama-3.3-70b-versatile");
            const result = await generateText({
                model,
                messages: [{ role: "user", content: prompt }],
                maxOutputTokens: 1500,
                temperature: 0.4,
            });
            rawAiText = result.text;
        } catch (aiError) {
            console.error("[AI Error]", aiError);
            return NextResponse.json(
                {
                    error: "AI service error",
                    message: "The AI service is temporarily unavailable. Please try again.",
                },
                { status: 503 }
            );
        }

        // Parse and strictly validate AI JSON output
        let parsedOutput: unknown;
        try {
            // Extract JSON from the response (handle any extra text)
            const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found in AI response");
            parsedOutput = JSON.parse(jsonMatch[0]);
        } catch {
            console.error("[Parse Error] AI response was not valid JSON:", rawAiText.slice(0, 200));
            return NextResponse.json(
                {
                    error: "AI response error",
                    message: "The AI returned an invalid response format. Please retry.",
                },
                { status: 502 }
            );
        }

        const validationResult = GapOutputSchema.safeParse(parsedOutput);
        if (!validationResult.success) {
            console.error("[Schema Error]", validationResult.error.flatten());
            return NextResponse.json(
                {
                    error: "AI output validation failed",
                    message: "The AI response did not match the expected schema. Please retry.",
                },
                { status: 502 }
            );
        }

        const scanResult = validationResult.data;

        // Persist scan to DB (non-blocking for edge — attempt but don't fail request)
        try {
            const session = await auth();
            if (session?.user?.email) {
                const user = await getUserByEmail(session.user.email);
                if (user) {
                    await db.insert(scans).values({
                        userId: user.id,
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
                    });
                }
            }
        } catch (dbError) {
            // Log but don't fail the request — user still gets results
            console.error("[DB Error] Failed to save scan:", dbError);
        }

        return NextResponse.json(
            {
                success: true,
                keyword: input.keyword,
                gaps: scanResult.gaps,
                meta: {
                    videoCount: input.videos.length,
                    commentCount: input.comments.length,
                    candidatesEvaluated: candidates.length,
                },
            },
            {
                status: 200,
                headers: {
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
            { status: 500 }
        );
    }
}
