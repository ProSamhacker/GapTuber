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
    title: z.string().min(5).max(200),
    description: z.string().max(5000).optional(),
    tags: z.array(z.string()).max(50).optional(),
    keyword: z.string().min(2).max(100),
    channelNiche: z.string().max(100).optional(),
});

// ─── Deterministic SEO Scoring ────────────────────────────────────────────────

function scoreTitleSEO(title: string, keyword: string): {
    score: number;
    issues: string[];
    suggestions: string[];
} {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const titleLower = title.toLowerCase();
    const kwLower = keyword.toLowerCase();

    // Length check (optimal: 50-70 chars)
    if (title.length < 30) { score -= 15; issues.push("Title too short (under 30 chars)"); suggestions.push("Expand title to 50-70 characters for better CTR"); }
    else if (title.length > 100) { score -= 10; issues.push("Title too long (over 100 chars)"); suggestions.push("Shorten title to under 70 characters"); }
    else if (title.length >= 50 && title.length <= 70) { score += 5; }

    // Keyword placement (front-loaded = better)
    const kwPosition = titleLower.indexOf(kwLower);
    if (kwPosition === -1) { score -= 25; issues.push("Primary keyword not in title"); suggestions.push(`Add "${keyword}" to your title`); }
    else if (kwPosition <= 10) { score += 10; }
    else if (kwPosition > 40) { score -= 5; suggestions.push("Move primary keyword closer to the beginning"); }

    // Power words
    const powerWords = ["ultimate", "complete", "best", "top", "proven", "secret", "free", "easy", "fast", "simple", "step-by-step", "beginners", "advanced", "master", "guide", "tutorial", "how to", "why", "what", "when"];
    const hasPowerWord = powerWords.some(w => titleLower.includes(w));
    if (!hasPowerWord) { score -= 5; suggestions.push("Add a power word (Ultimate, Complete, Best, How to, etc.)"); }

    // Numbers (increase CTR by ~36%)
    const hasNumber = /\d+/.test(title);
    if (!hasNumber) { suggestions.push("Consider adding a number (e.g., '5 Ways', '10 Tips', '2026')"); }

    // Year freshness
    const currentYear = new Date().getFullYear();
    if (title.includes(String(currentYear)) || title.includes(String(currentYear + 1))) { score += 5; }

    // Brackets/parentheses (increase CTR)
    if (/[\[\(]/.test(title)) { score += 3; }

    // Question format
    if (/\?$/.test(title)) { score += 3; }

    // ALL CAPS words (spammy)
    const capsWords = title.split(" ").filter(w => w.length > 3 && w === w.toUpperCase());
    if (capsWords.length > 2) { score -= 10; issues.push("Too many ALL CAPS words (looks spammy)"); }

    return { score: Math.min(100, Math.max(0, score)), issues, suggestions };
}

function scoreDescriptionSEO(description: string, keyword: string): {
    score: number;
    issues: string[];
    suggestions: string[];
} {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!description || description.length === 0) {
        return { score: 0, issues: ["No description provided"], suggestions: ["Add a detailed description (300-500 words minimum)"] };
    }

    const descLower = description.toLowerCase();
    const kwLower = keyword.toLowerCase();

    // Length
    if (description.length < 200) { score -= 20; issues.push("Description too short"); suggestions.push("Expand description to at least 300 words"); }
    else if (description.length >= 500) { score += 10; }

    // Keyword in first 100 chars
    if (!descLower.slice(0, 100).includes(kwLower)) { score -= 15; suggestions.push("Include primary keyword in first 100 characters of description"); }

    // Keyword density (1-2% is optimal)
    const words = description.split(/\s+/).length;
    const kwOccurrences = (descLower.match(new RegExp(kwLower, "g")) ?? []).length;
    const density = kwOccurrences / words;
    if (density < 0.01) { score -= 10; suggestions.push("Increase keyword density to 1-2%"); }
    else if (density > 0.04) { score -= 15; issues.push("Keyword stuffing detected"); suggestions.push("Reduce keyword repetition to 1-2% density"); }

    // Timestamps
    if (/\d+:\d+/.test(description)) { score += 10; }
    else { suggestions.push("Add timestamps to improve watch time and SEO"); }

    // Links
    if (/https?:\/\//.test(description)) { score += 5; }

    // Call to action
    const ctaWords = ["subscribe", "like", "comment", "share", "follow", "click", "check out"];
    if (ctaWords.some(w => descLower.includes(w))) { score += 5; }
    else { suggestions.push("Add a call-to-action (subscribe, like, comment)"); }

    return { score: Math.min(100, Math.max(0, score)), issues, suggestions };
}

function scoreTagsSEO(tags: string[], keyword: string): {
    score: number;
    issues: string[];
    suggestions: string[];
    tagCount: number;
} {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    if (!tags || tags.length === 0) {
        return { score: 0, issues: ["No tags provided"], suggestions: ["Add 10-15 relevant tags"], tagCount: 0 };
    }

    const kwLower = keyword.toLowerCase();
    const hasExactKeyword = tags.some(t => t.toLowerCase() === kwLower);
    const hasKeywordVariation = tags.some(t => t.toLowerCase().includes(kwLower));

    if (!hasExactKeyword) { score -= 20; issues.push("Exact keyword not in tags"); suggestions.push(`Add "${keyword}" as an exact-match tag`); }
    if (!hasKeywordVariation) { score -= 10; }

    if (tags.length < 5) { score -= 15; issues.push("Too few tags (under 5)"); suggestions.push("Add 10-15 tags for better discoverability"); }
    else if (tags.length >= 10 && tags.length <= 15) { score += 10; }
    else if (tags.length > 20) { score -= 5; issues.push("Too many tags may dilute relevance"); }

    // Check for long-tail tags
    const longTailTags = tags.filter(t => t.split(" ").length >= 3);
    if (longTailTags.length < 3) { suggestions.push("Add more long-tail tags (3+ words) for easier ranking"); }

    return { score: Math.min(100, Math.max(0, score)), issues, suggestions, tagCount: tags.length };
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

    const { title, description, tags, keyword, channelNiche } = parsed.data;

    // Deterministic scoring
    const titleSEO = scoreTitleSEO(title, keyword);
    const descSEO = scoreDescriptionSEO(description ?? "", keyword);
    const tagsSEO = scoreTagsSEO(tags ?? [], keyword);

    // Overall SEO score (weighted)
    const overallScore = Math.round(
        titleSEO.score * 0.40 +
        descSEO.score * 0.35 +
        tagsSEO.score * 0.25
    );

    // AI-powered improvement suggestions
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


    let aiSuggestions: { improvedTitle: string; improvedDescription: string; additionalTags: string[] } = {
        improvedTitle: title,
        improvedDescription: description ?? "",
        additionalTags: [],
    };

    let success = false;
    let lastError: any = null;

    const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

    for (const activeKey of shuffledKeys) {
        try {
            const prompt = `You are a YouTube SEO expert. Analyze and improve this video's SEO.

KEYWORD: "${keyword}"
NICHE: ${channelNiche ?? "Tech/AI"}
CURRENT TITLE: "${title}"
CURRENT DESCRIPTION (first 300 chars): "${(description ?? "").slice(0, 300)}"
CURRENT TAGS: ${(tags ?? []).slice(0, 10).join(", ")}

SEO SCORES: Title: ${titleSEO.score}/100, Description: ${descSEO.score}/100, Tags: ${tagsSEO.score}/100

Provide:
1. An improved title (keep under 70 chars, front-load keyword, add power word)
2. An improved description opening (first 150 chars, include keyword naturally)
3. 10 additional high-value tags

Respond with ONLY this JSON:
{
  "improvedTitle": "string",
  "improvedDescription": "string",
  "additionalTags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"]
}`;

            const groq = createGroq({ apiKey: activeKey });
            const result = await generateText({
                model: groq("llama-3.3-70b-versatile"),
                messages: [
                    { role: "system", content: "You are a JSON API. Respond with only valid JSON." },
                    { role: "user", content: prompt },
                ],
                maxOutputTokens: 800,
                temperature: 0.3,
            });

            const start = result.text.indexOf("{");
            const end = result.text.lastIndexOf("}");
            if (start !== -1 && end > start) {
                const parsed2 = JSON.parse(result.text.slice(start, end + 1)) as typeof aiSuggestions;
                aiSuggestions = parsed2;
            }
            success = true;
            break;
        } catch (aiErr: any) {
            lastError = aiErr;
            console.warn("[Key Rotation SeoAudit] Key failed, trying next...");
        }
    }

    if (!success) {
        console.error("[SeoAudit AI Error] All keys exhausted.", lastError);
    }

    return NextResponse.json({
        success: true,
        keyword,
        scores: {
            overall: overallScore,
            title: titleSEO.score,
            description: descSEO.score,
            tags: tagsSEO.score,
        },
        issues: [
            ...titleSEO.issues.map(i => ({ type: "title", message: i })),
            ...descSEO.issues.map(i => ({ type: "description", message: i })),
            ...tagsSEO.issues.map(i => ({ type: "tags", message: i })),
        ],
        suggestions: [
            ...titleSEO.suggestions.map(s => ({ type: "title", message: s })),
            ...descSEO.suggestions.map(s => ({ type: "description", message: s })),
            ...tagsSEO.suggestions.map(s => ({ type: "tags", message: s })),
        ],
        improvements: aiSuggestions,
        tagCount: tagsSEO.tagCount,
    }, { status: 200, headers: cors });
}
