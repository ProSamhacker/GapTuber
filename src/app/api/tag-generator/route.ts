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
    title: z.string().min(5).max(200).optional(),
    niche: z.string().max(100).optional(),
    competitorTags: z.array(z.string()).max(100).optional(),
});

// Tag categories for structured generation
const TAG_TEMPLATES = {
    exact: (kw: string) => [kw, `${kw} tutorial`, `${kw} guide`, `${kw} course`],
    intent: (kw: string) => [`how to ${kw}`, `learn ${kw}`, `${kw} for beginners`, `${kw} explained`],
    year: (kw: string) => [`${kw} 2025`, `${kw} 2026`, `${kw} latest`],
    comparison: (kw: string) => [`best ${kw}`, `${kw} vs`, `${kw} alternatives`, `${kw} review`],
    problem: (kw: string) => [`${kw} not working`, `${kw} error`, `${kw} fix`, `${kw} tips`],
    advanced: (kw: string) => [`advanced ${kw}`, `${kw} masterclass`, `${kw} deep dive`, `${kw} complete`],
};

function generateDeterministicTags(keyword: string, competitorTags: string[]): {
    tags: string[];
    categories: Record<string, string[]>;
} {
    const kw = keyword.toLowerCase().trim();
    const categories: Record<string, string[]> = {};

    for (const [cat, fn] of Object.entries(TAG_TEMPLATES)) {
        categories[cat] = fn(kw);
    }

    // Extract high-value tags from competitors
    const competitorFreq = new Map<string, number>();
    for (const tag of competitorTags) {
        const t = tag.toLowerCase().trim();
        competitorFreq.set(t, (competitorFreq.get(t) ?? 0) + 1);
    }

    const topCompetitorTags = [...competitorFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

    categories["competitor_derived"] = topCompetitorTags;

    const allTags = [...new Set(Object.values(categories).flat())];

    return { tags: allTags.slice(0, 30), categories };
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

    const { keyword, title, niche, competitorTags } = parsed.data;

    // Deterministic tag generation
    const { tags: deterministicTags, categories } = generateDeterministicTags(keyword, competitorTags ?? []);

    // AI-powered tag expansion
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

    let aiTags: string[] = [];

    let success = false;
    let lastError: any = null;

    const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

    for (const activeKey of shuffledKeys) {
        try {
            const prompt = `You are a YouTube SEO expert specializing in tag optimization.

KEYWORD: "${keyword}"
VIDEO TITLE: "${title ?? keyword}"
NICHE: ${niche ?? "Tech/AI/Programming"}

Generate 20 high-value YouTube tags for this video. Focus on:
1. Long-tail keywords with search intent
2. Related topics viewers also search for
3. Trending variations of the keyword
4. Problem-solution tags
5. Audience-specific tags (beginners, advanced, professionals)

Rules:
- Each tag should be 1-5 words
- Mix broad and specific tags
- Include year-specific tags (2025, 2026)
- No duplicate concepts

Respond with ONLY this JSON:
{
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13", "tag14", "tag15", "tag16", "tag17", "tag18", "tag19", "tag20"]
}`;

            const groq = createGroq({ apiKey: activeKey });
            const result = await generateText({
                model: groq("llama-3.3-70b-versatile"),
                messages: [
                    { role: "system", content: "You are a JSON API. Respond with only valid JSON." },
                    { role: "user", content: prompt },
                ],
                maxOutputTokens: 600,
                temperature: 0.4,
            });

            const start = result.text.indexOf("{");
            const end = result.text.lastIndexOf("}");
            if (start !== -1 && end > start) {
                const parsed2 = JSON.parse(result.text.slice(start, end + 1)) as { tags: string[] };
                aiTags = parsed2.tags ?? [];
            }
            success = true;
            break;
        } catch (aiErr: any) {
            lastError = aiErr;
            console.warn("[Key Rotation TagGenerator] Key failed, trying next...");
        }
    }

    if (!success) {
        console.error("[TagGenerator AI Error] All keys exhausted.", lastError);
    }

    // Merge and deduplicate
    const allTags = [...new Set([...deterministicTags, ...aiTags])].slice(0, 50);

    // Score each tag by relevance
    const scoredTags = allTags.map(tag => {
        const tagLower = tag.toLowerCase();
        const kwLower = keyword.toLowerCase();
        let relevance = 50;

        if (tagLower === kwLower) relevance = 100;
        else if (tagLower.includes(kwLower)) relevance = 80;
        else if (kwLower.split(" ").some(w => tagLower.includes(w))) relevance = 60;

        // Boost for intent modifiers
        if (/tutorial|guide|how to|learn|beginner/.test(tagLower)) relevance += 10;
        if (/2025|2026/.test(tagLower)) relevance += 5;

        return { tag, relevance };
    }).sort((a, b) => b.relevance - a.relevance);

    return NextResponse.json({
        success: true,
        keyword,
        tags: scoredTags.map(t => t.tag),
        scoredTags,
        categories,
        totalCount: scoredTags.length,
        recommendation: `Use the top 10-15 tags. Start with exact keyword tags, then add intent-based and long-tail variations.`,
    }, { status: 200, headers: cors });
}
