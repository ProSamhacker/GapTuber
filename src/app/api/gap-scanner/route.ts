import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateObject } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { decode } from "next-auth/jwt";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { getUserByEmail } from "@/db/queries";

export const runtime = "edge";


// ─── CORS ──────────────────────────────────────────────────────────────────────

function getCorsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get("origin") ?? "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    };
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

// ─── Zod Schemas ───────────────────────────────────────────────────────────────

const GapItemSchema = z.object({
    title: z.string().describe("Specific, clickable YouTube video title addressing the gap"),
    gapScore: z.number().min(1).max(10).describe("How strong this content gap is (1–10)"),
    reasoning: z.string().describe("Why this gap exists based on comment evidence"),
    hook: z.string().describe("Opening hook sentence for the video script"),
    format: z.string().describe("Recommended format e.g. 'Tutorial', 'Deep Dive', 'Comparison'"),
    monetizationAngle: z.string().describe("How to monetize this video concept"),
    targetAudience: z.string().optional().describe("Who specifically this video is for"),
    competitorWeakness: z.string().optional().describe("What the original video got wrong that you will fix"),
    contentOutline: z.array(z.string()).optional().describe("3–5 bullet points for the video structure"),
    seoTips: z.array(z.string()).optional().describe("2–3 SEO optimisation tips for this topic"),
});

const ResponseSchema = z.object({
    success: z.boolean(),
    keyword: z.string(),
    gaps: z.array(GapItemSchema),
    overallOpportunity: z.string().describe("1-sentence summary of the overall opportunity found"),
    commentInsights: z.object({
        totalAnalyzed: z.number(),
        frustrationRate: z.number().min(0).max(100),
        topPainPoints: z.array(z.string()).max(5),
        topQuestions: z.array(z.string()).max(5),
    }),
});

// ─── Auth helper: session cookie or X-Session-Token header ────────────────────

async function resolveUserEmail(req: NextRequest): Promise<string | null> {
    try {
        const session = await auth();
        if (session?.user?.email) return session.user.email;
    } catch { /* ignore */ }

    const headerToken = req.headers.get("X-Session-Token");
    if (!headerToken) return null;

    const salts = [
        "__Secure-authjs.session-token",
        "authjs.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.session-token",
    ];
    for (const salt of salts) {
        try {
            const decoded = await decode({ token: headerToken, secret: process.env.AUTH_SECRET!, salt });
            if (decoded?.email) return decoded.email as string;
        } catch { /* try next salt */ }
    }
    return null;
}

// ─── POST Handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const corsHeaders = getCorsHeaders(req);

    try {
        const body = await req.json() as {
            keyword?: string;
            videoTitle?: string;
            comments?: Array<{ text: string; likeCount?: number }>;
            channelId?: string;
        };

        const { keyword = "youtube", videoTitle = "Unknown Video", comments = [], channelId = "" } = body;

        if (!comments.length) {
            return NextResponse.json(
                { success: false, error: "No comments provided for analysis." },
                { status: 400, headers: corsHeaders }
            );
        }

        const keys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3
        ].filter(Boolean) as string[];

        if (keys.length === 0) {
            return NextResponse.json(
                { success: false, error: "Groq API keys not configured." },
                { status: 500, headers: corsHeaders }
            );
        }


        // Sort by likes DESC, take top 35
        const sorted = [...comments]
            .sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
            .slice(0, 35);

        const commentText = sorted
            .map((c, i) => `${i + 1}. [${c.likeCount ?? 0} likes] "${c.text}"`)
            .join("\n");

        const prompt = `You are an elite YouTube Strategy Analyst with deep expertise in content gap detection.

Analyze the following viewer comments from a YouTube video to find HIGH-VALUE content gaps.

TARGET KEYWORD: "${keyword}"
VIDEO ANALYZED: "${videoTitle}"

TOP VIEWER COMMENTS (sorted by likes — higher likes = more viewers agree):
${commentText}

YOUR MISSION:
1. Find UNANSWERED QUESTIONS — things viewers asked but weren't addressed
2. Find COMPLAINTS — what viewers say the video missed, got wrong, or glossed over
3. Find REQUESTS — specific use-cases, scenarios, or depths viewers wanted
4. Find FRUSTRATIONS — pain points mentioned repeatedly by high-liked comments

Based on these real viewer frustrations, generate exactly 4 specific, high-converting YouTube video concepts that:
- Directly answer the top frustrations/questions found
- Are specific (not generic) — backed by actual comment evidence
- Have clear monetization potential
- Would make someone say "FINALLY a video about this!"

For overallOpportunity, write a single compelling sentence summarizing what huge opportunity exists in this comment section.

For commentInsights:
- totalAnalyzed: number of comments you reviewed
- frustrationRate: estimated % of comments expressing frustration or unanswered questions (0-100)
- topPainPoints: top 5 pain points from comments (short phrases)
- topQuestions: top 5 questions viewers asked that weren't answered`;

        let object: any = null;
        let success = false;
        let lastError: any = null;

        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const activeKey of shuffledKeys) {
            try {
                const groq = createGroq({ apiKey: activeKey });
                const result = await generateObject({
                    model: groq("llama-3.3-70b-versatile"),
                    schema: ResponseSchema,
                    prompt,
                    temperature: 0.4,
                });
                object = result.object;
                success = true;
                break;
            } catch (aiErr: any) {
                lastError = aiErr;
                console.warn("[Key Rotation GapScanner] Key failed, trying next...");
            }
        }

        if (!success || !object) {
            console.error("[Gap Scanner AI Error] All keys exhausted.", lastError);
            return NextResponse.json({ success: false, error: "AI service temporarily unavailable (Rate limit)." }, { status: 503, headers: corsHeaders });
        }

        // ── Persist to DB (non-blocking, fire-and-forget) ───────────────────────
        try {
            const userEmail = await resolveUserEmail(req);
            if (userEmail) {
                const user = await getUserByEmail(userEmail);
                if (user) {
                    let targetChannelId = channelId;
                    if (!targetChannelId) {
                        const { getChannelsByUserId } = await import("@/db/queries");
                        const userChannels = await getChannelsByUserId(user.id);
                        if (userChannels.length > 0) {
                            targetChannelId = userChannels[0].id;
                        }
                    }

                    if (targetChannelId) {
                        await db.insert(scans).values({
                            userId: user.id,
                            channelId: targetChannelId,
                            keyword,
                            competitors: [],       // comment mining has no competitor URLs
                            rawData: {
                                source: "comment-mine",
                                videoTitle,
                                commentCount: comments.length,
                                commentInsights: object.commentInsights,
                            },
                            result: {
                                gaps: object.gaps,
                                overallOpportunity: object.overallOpportunity,
                            },
                            analytics: null,       // no channel analytics for comment mining
                        });
                        console.log(`[GapScanner] Saved ${object.gaps.length} gaps for ${userEmail} — "${keyword}" on channel ${targetChannelId}`);
                    }
                }
            }
        } catch (dbErr) {
            // Non-blocking — user still sees results even if DB save fails
            console.error("[GapScanner DB Error]", dbErr);
        }

        return NextResponse.json(
            { ...object, success: true, keyword },
            { headers: corsHeaders }
        );

    } catch (err) {
        console.error("[GAP_SCANNER_ERROR]", err);
        return NextResponse.json(
            { success: false, error: "Failed to analyze comments." },
            { status: 500, headers: corsHeaders }
        );
    }
}
