// Deterministic Scoring Engine
// Phase 1: Pure data-driven gap detection before any AI call

export interface VideoData {
    title: string;
    views: number;
    uploadDate: string; // ISO string
    url: string;
    channel: string;
}

export interface CommentData {
    text: string;
    videoUrl?: string;
}

export interface SearchResult {
    title: string;
    channel: string;
    views: number;
    uploadDate: string;
}

export interface ScoringInput {
    keyword: string;
    videos: VideoData[];
    comments: CommentData[];
    searchResults: SearchResult[];
}

export interface ScoreBreakdown {
    velocityScore: number;      // 0-10
    saturationScore: number;    // 0-10 (10 = low saturation = good)
    frustrationScore: number;   // 0-10
    abandonmentScore: number;   // 0-10
    compositeScore: number;     // 0-10 weighted
}

export interface GapCandidate {
    title: string;
    angle: string;
    scores: ScoreBreakdown;
    topFrustrationKeywords: string[];
    velocityInsight: string;
    saturationInsight: string;
}

const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "this", "that", "these", "those", "it", "its",
    "i", "me", "my", "we", "our", "you", "your", "he", "she", "they", "their",
    "what", "which", "who", "how", "when", "where", "why", "just", "very",
    "so", "if", "not", "no", "can", "get", "got", "like", "also", "more",
]);

const FRUSTRATION_PHRASES = [
    "doesn't work", "not working", "broken", "outdated", "old tutorial",
    "deprecated", "confused", "confusing", "unclear", "explain", "please explain",
    "what about", "why doesn't", "why isn't", "still doesn't", "tried everything",
    "nobody explains", "can't find", "need help", "lost", "stuck", "beginner",
    "for beginners", "too complex", "too complicated", "simplified", "simpler version",
    "update", "updated version", "2025", "2026", "latest", "current",
    "alternative", "better way", "easier way", "without", "error", "fix",
];

function daysSince(dateStr: string): number {
    const uploaded = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - uploaded.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function computeVelocityScore(videos: VideoData[]): {
    score: number;
    insight: string;
    topVideos: VideoData[];
} {
    if (videos.length === 0) return { score: 0, insight: "No videos found", topVideos: [] };

    const withVelocity = videos.map((v) => ({
        ...v,
        velocity: v.views / daysSince(v.uploadDate),
    }));

    withVelocity.sort((a, b) => b.velocity - a.velocity);

    const maxVelocity = withVelocity[0].velocity;
    const avgVelocity = withVelocity.reduce((sum, v) => sum + v.velocity, 0) / withVelocity.length;

    // Normalize: higher velocity = higher score
    // Score based on whether videos are gaining traction quickly
    const velocityRatio = maxVelocity > 0 ? Math.min(10, (maxVelocity / 1000) * 3) : 0;
    const score = Math.min(10, velocityRatio);

    const topVideos = withVelocity.slice(0, 5);
    const insight = `Top video gaining ${Math.round(maxVelocity)} views/day. Avg: ${Math.round(avgVelocity)} views/day across ${videos.length} videos.`;

    return { score, insight, topVideos };
}

export function computeSaturationScore(searchResults: SearchResult[]): {
    score: number;
    insight: string;
} {
    if (searchResults.length === 0) {
        return { score: 10, insight: "No results found — extremely low saturation." };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentUploads = searchResults.filter((r) => {
        try {
            return new Date(r.uploadDate) >= thirtyDaysAgo;
        } catch {
            return false;
        }
    });

    const recentCount = recentUploads.length;

    // Invert: fewer recent uploads = higher score (less saturated = more opportunity)
    let score: number;
    if (recentCount === 0) score = 10;
    else if (recentCount <= 2) score = 8.5;
    else if (recentCount <= 5) score = 7;
    else if (recentCount <= 10) score = 5;
    else if (recentCount <= 15) score = 3;
    else score = 1.5;

    const insight = `${recentCount} uploads in last 30 days out of top ${searchResults.length} results.`;
    return { score, insight };
}

export function computeFrustrationScore(comments: CommentData[]): {
    score: number;
    topKeywords: string[];
} {
    if (comments.length === 0) return { score: 0, topKeywords: [] };

    const wordFreq = new Map<string, number>();
    let frustrationHits = 0;

    for (const comment of comments) {
        const text = comment.text.toLowerCase();

        // Check frustration phrases
        for (const phrase of FRUSTRATION_PHRASES) {
            if (text.includes(phrase)) {
                frustrationHits++;
                break;
            }
        }

        // Word frequency (excluding stop words)
        const words = text
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

        for (const word of words) {
            wordFreq.set(word, (wordFreq.get(word) ?? 0) + 1);
        }
    }

    // Top keywords by frequency
    const sorted = [...wordFreq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word);

    const frustrationRatio = frustrationHits / comments.length;
    const score = Math.min(10, frustrationRatio * 20); // 50% = score 10

    return { score, topKeywords: sorted };
}

export function computeAbandonmentScore(videos: VideoData[]): {
    score: number;
} {
    if (videos.length === 0) return { score: 0 };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const highPerformingVideos = videos.filter((v) => v.views > 50000);
    const recentVideos = videos.filter((v) => {
        try {
            return new Date(v.uploadDate) >= thirtyDaysAgo;
        } catch {
            return false;
        }
    });

    // High abandoned: many high-performing old videos, few recent uploads
    if (highPerformingVideos.length >= 2 && recentVideos.length === 0) {
        return { score: 10 };
    }
    if (highPerformingVideos.length >= 2 && recentVideos.length <= 1) {
        return { score: 7.5 };
    }
    if (highPerformingVideos.length >= 1 && recentVideos.length === 0) {
        return { score: 6 };
    }
    if (recentVideos.length === 0) {
        return { score: 4 };
    }

    return { score: 1 };
}

export function buildGapCandidates(input: ScoringInput): GapCandidate[] {
    const velocity = computeVelocityScore(input.videos);
    const saturation = computeSaturationScore(input.searchResults);
    const frustration = computeFrustrationScore(input.comments);
    const abandonment = computeAbandonmentScore(input.videos);

    // Weighted composite score
    const compositeScore =
        velocity.score * 0.30 +
        frustration.score * 0.30 +
        saturation.score * 0.25 +
        abandonment.score * 0.15;

    const roundedComposite = Math.round(compositeScore * 10) / 10;

    // Generate 5 gap candidates based on templates + signals
    const keyword = input.keyword;
    const topFrustrations = frustration.topKeywords.slice(0, 5);

    const candidates: GapCandidate[] = [
        {
            title: `Beginner-Focused ${keyword} Tutorial (2026 Updated)`,
            angle: "beginner_explainer",
            scores: {
                velocityScore: velocity.score,
                saturationScore: saturation.score,
                frustrationScore: frustration.score,
                abandonmentScore: abandonment.score,
                compositeScore: roundedComposite,
            },
            topFrustrationKeywords: topFrustrations,
            velocityInsight: velocity.insight,
            saturationInsight: saturation.insight,
        },
        {
            title: `Why Most ${keyword} Tutorials Fail (and What Actually Works)`,
            angle: "contrarian_critique",
            scores: {
                velocityScore: velocity.score,
                saturationScore: saturation.score,
                frustrationScore: frustration.score,
                abandonmentScore: abandonment.score,
                compositeScore: Math.round((roundedComposite - 0.3) * 10) / 10,
            },
            topFrustrationKeywords: topFrustrations,
            velocityInsight: velocity.insight,
            saturationInsight: saturation.insight,
        },
        {
            title: `${keyword} for Solo Developers: The Practical Guide`,
            angle: "practical_solo",
            scores: {
                velocityScore: velocity.score,
                saturationScore: saturation.score,
                frustrationScore: frustration.score,
                abandonmentScore: abandonment.score,
                compositeScore: Math.round((roundedComposite - 0.5) * 10) / 10,
            },
            topFrustrationKeywords: topFrustrations,
            velocityInsight: velocity.insight,
            saturationInsight: saturation.insight,
        },
        {
            title: `${keyword} Common Mistakes Beginners Make`,
            angle: "mistakes_avoidance",
            scores: {
                velocityScore: velocity.score,
                saturationScore: saturation.score,
                frustrationScore: frustration.score,
                abandonmentScore: abandonment.score,
                compositeScore: Math.round((roundedComposite - 0.7) * 10) / 10,
            },
            topFrustrationKeywords: topFrustrations,
            velocityInsight: velocity.insight,
            saturationInsight: saturation.insight,
        },
        {
            title: `${keyword} vs Alternatives: Which Should You Use in 2026?`,
            angle: "comparison",
            scores: {
                velocityScore: velocity.score,
                saturationScore: saturation.score,
                frustrationScore: frustration.score,
                abandonmentScore: abandonment.score,
                compositeScore: Math.round((roundedComposite - 0.9) * 10) / 10,
            },
            topFrustrationKeywords: topFrustrations,
            velocityInsight: velocity.insight,
            saturationInsight: saturation.insight,
        },
    ];

    return candidates;
}
