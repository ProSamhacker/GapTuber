import type { GapCandidate } from "./scoring";

/**
 * Builds a token-optimized prompt for Groq.
 * Sends ONLY: top 5 candidates, key metrics, top frustration keywords, velocity insights.
 * NEVER sends raw comments.
 */
export function buildAnalysisPrompt(
    keyword: string,
    candidates: GapCandidate[]
): string {
    const candidatesSummary = candidates
        .map(
            (c, i) =>
                `${i + 1}. Title Template: "${c.title}"
   Angle: ${c.angle}
   Composite Gap Score: ${c.scores.compositeScore}/10
   Velocity: ${c.scores.velocityScore.toFixed(1)}/10 — ${c.velocityInsight}
   Saturation: ${c.scores.saturationScore.toFixed(1)}/10 — ${c.saturationInsight}
   Frustration: ${c.scores.frustrationScore.toFixed(1)}/10
   Abandonment: ${c.scores.abandonmentScore.toFixed(1)}/10
   Top Audience Pain Keywords: ${c.topFrustrationKeywords.join(", ")}`
        )
        .join("\n\n");

    return `You are a senior YouTube content strategist specializing in Tech and AI channels.

TASK: Analyze these 5 data-backed content gap candidates for the keyword "${keyword}". Select and refine the TOP 3 highest-opportunity gaps. Produce concrete, actionable output.

GAP CANDIDATES (ranked by composite score):
${candidatesSummary}

INSTRUCTIONS:
- Pick the 3 best gaps and refine them with specific, compelling titles
- gapScore must reflect the data (use the composite scores as a starting point)
- reasoning must cite specific signals (velocity, saturation, frustration)
- hook must be a strong opening line the creator can use verbatim
- format must be specific (e.g., "12-min tutorial with timestamps", "comparison deep-dive")
- monetizationAngle must be specific tools/sponsors relevant to the topic

You MUST respond with ONLY this exact JSON structure, no additional text:
{
  "gaps": [
    {
      "title": "string",
      "gapScore": number,
      "reasoning": "string",
      "hook": "string",
      "format": "string",
      "monetizationAngle": "string"
    },
    {
      "title": "string",
      "gapScore": number,
      "reasoning": "string",
      "hook": "string",
      "format": "string",
      "monetizationAngle": "string"
    },
    {
      "title": "string",
      "gapScore": number,
      "reasoning": "string",
      "hook": "string",
      "format": "string",
      "monetizationAngle": "string"
    }
  ]
}`;
}
