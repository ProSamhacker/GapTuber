import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { z } from "zod";

export const runtime = "edge";

function getCorsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get("origin") ?? "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Vary": "Origin",
    };
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

const RequestSchema = z.object({
    keyword: z.string().min(2).max(100),
    title: z.string().min(5).max(200),
    niche: z.string().max(100).optional(),
    competitorThumbnailDescriptions: z.array(z.string()).max(10).optional(),
});

// Thumbnail best practices scoring
function scoreThumbnailConcept(title: string, keyword: string): {
    score: number;
    recommendations: string[];
    colorPsychology: string;
    textOverlayTips: string[];
    faceRecommendation: string;
} {
    const recommendations: string[] = [];
    const textOverlayTips: string[] = [];
    let score = 60; // baseline

    const titleLower = title.toLowerCase();
    const kwLower = keyword.toLowerCase();

    // Check if keyword can be shown visually
    const isVisualKeyword = /code|build|create|design|tutorial|demo|example|project/.test(kwLower);
    if (isVisualKeyword) {
        score += 10;
        recommendations.push("Show the end result/output prominently in thumbnail");
    }

    // Emotion triggers
    const emotionWords = ["mistake", "wrong", "fail", "secret", "truth", "never", "always", "best", "worst"];
    const hasEmotion = emotionWords.some(w => titleLower.includes(w));
    if (hasEmotion) {
        score += 10;
        recommendations.push("Use a surprised/shocked facial expression to match the emotional title");
    }

    // Number in title = show it big
    const numberMatch = title.match(/\d+/);
    if (numberMatch) {
        score += 5;
        textOverlayTips.push(`Show "${numberMatch[0]}" in large, bold text on thumbnail`);
    }

    // Color psychology based on niche
    const colorPsychology = "Use high-contrast colors: dark background (#0a0a0a or #1a1a2e) with bright accent (#00d4ff or #ff6b35). Avoid red/green combinations (colorblind users). Yellow text on dark background has highest readability.";

    // Text overlay
    textOverlayTips.push("Keep text to 3-5 words maximum");
    textOverlayTips.push("Use font size 60pt+ for main text");
    textOverlayTips.push("Add subtle drop shadow to text for readability");
    textOverlayTips.push("Place text in bottom-left or top-right (avoid center)");

    // Face recommendation
    const faceRecommendation = "Include a human face with clear emotion — thumbnails with faces get 38% higher CTR. Use direct eye contact with camera. Expression should match video tone (excited for tutorials, serious for analysis).";

    recommendations.push("Use 1280x720px (16:9 ratio) at 72 DPI minimum");
    recommendations.push("Test thumbnail at small size (mobile) — must be readable at 120px wide");
    recommendations.push("Avoid cluttered backgrounds — use solid colors or blurred backgrounds");
    recommendations.push("Brand consistency: use same font/color scheme across all thumbnails");

    return { score, recommendations, colorPsychology, textOverlayTips, faceRecommendation };
}

export async function POST(req: NextRequest) {
    const cors = getCorsHeaders(req);

    let body: unknown;
    try { body = await req.json(); } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: cors });
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400, headers: cors });
    }

    const { keyword, title, niche, competitorThumbnailDescriptions } = parsed.data;

    // Deterministic thumbnail scoring
    const thumbnailScore = scoreThumbnailConcept(title, keyword);

    // AI-powered thumbnail concept generation
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

    let aiConcepts: { concepts: Array<{ description: string; textOverlay: string; colorScheme: string; emotionalHook: string }> } = { concepts: [] };

    let success = false;
    let lastError: any = null;

    const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

    for (const activeKey of shuffledKeys) {
        try {
            const competitorContext = competitorThumbnailDescriptions?.length
                ? `\nCOMPETITOR THUMBNAILS: ${competitorThumbnailDescriptions.slice(0, 5).join(" | ")}`
                : "";

            const prompt = `You are a YouTube thumbnail design expert with deep knowledge of CTR optimization.

VIDEO TITLE: "${title}"
KEYWORD: "${keyword}"
NICHE: ${niche ?? "Tech/AI"}${competitorContext}

Generate 3 distinct thumbnail concepts that will maximize CTR. Each concept should be different in approach.

For each concept provide:
- description: What to show visually (be specific about layout, elements, composition)
- textOverlay: Exact text to overlay (3-5 words max)
- colorScheme: Specific hex colors for background, text, accents
- emotionalHook: The psychological trigger this thumbnail uses

Respond with ONLY this JSON:
{
  "concepts": [
    {
      "description": "string",
      "textOverlay": "string",
      "colorScheme": "string",
      "emotionalHook": "string"
    }
  ]
}`;

            const groq = createGroq({ apiKey: activeKey });
            const result = await generateText({
                model: groq("llama-3.3-70b-versatile"),
                messages: [
                    { role: "system", content: "You are a JSON API. Respond with only valid JSON." },
                    { role: "user", content: prompt },
                ],
                maxOutputTokens: 800,
                temperature: 0.5,
            });

            const start = result.text.indexOf("{");
            const end = result.text.lastIndexOf("}");
            if (start !== -1 && end > start) {
                aiConcepts = JSON.parse(result.text.slice(start, end + 1)) as typeof aiConcepts;
            }
            success = true;
            break;
        } catch (aiErr: any) {
            lastError = aiErr;
            console.warn("[Key Rotation ThumbnailAnalyze] Key failed, trying next...");
        }
    }

    if (!success) {
        console.error("[Thumbnail AI Error] All keys exhausted.", lastError);
    }

    return NextResponse.json({
        success: true,
        keyword,
        title,
        score: thumbnailScore.score,
        recommendations: thumbnailScore.recommendations,
        colorPsychology: thumbnailScore.colorPsychology,
        textOverlayTips: thumbnailScore.textOverlayTips,
        faceRecommendation: thumbnailScore.faceRecommendation,
        aiConcepts: aiConcepts.concepts,
        technicalSpecs: {
            dimensions: "1280x720 pixels",
            aspectRatio: "16:9",
            maxFileSize: "2MB",
            formats: ["JPG", "PNG", "GIF (no animation)"],
            minResolution: "640x360",
        },
        ctrBenchmarks: {
            excellent: "> 10%",
            good: "5-10%",
            average: "2-5%",
            poor: "< 2%",
            tip: "Average YouTube CTR is 4-5%. Aim for 6%+ with optimized thumbnails.",
        },
    }, { status: 200, headers: cors });
}
