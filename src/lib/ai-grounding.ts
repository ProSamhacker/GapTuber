export function buildScriptGroundingRules(now = new Date()): string {
    return `FACTUAL INTEGRITY RULES (mandatory):
- Current UTC date: ${now.toISOString()}. Treat model training knowledge as background only, never as proof that something is current.
- Never invent a person, account, follower count, product/model name, training dataset, price, free trial, sponsor, link, test result, score, view count, quote, or statistic.
- Use a factual claim only when it appears in the user's message or supplied channel/evidence context. Do not upgrade an estimate or AI score into an observed fact.
- If the video is an experiment that has not been run, write it as a shoot-ready experiment plan. Use explicit placeholders such as [INSERT VERIFIED RESULT], [CREATOR NAME], and [TOOL ACTUALLY USED] for facts that will only exist after filming.
- Never narrate a winner or outcome before real results are supplied. Provide conditional branches for each possible outcome when helpful.
- Do not call a sound, tool, feature, price, or topic "trending", "latest", "free", or "new" without dated evidence in the supplied context.
- Do not add promotional offers, downloads, affiliate links, or brand claims unless the user supplied them.
- Clearly label hypothetical examples. If evidence is missing, say what must be verified instead of filling the gap with plausible-sounding details.`;
}

