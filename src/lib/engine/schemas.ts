import { z } from "zod";

// Input validation schema for the /api/analyze route
export const AnalyzeRequestSchema = z.object({
    keyword: z.string().min(2).max(100).trim(),
    competitors: z.array(z.string().url()).min(1).max(3),
    videos: z.array(
        z.object({
            title: z.string(),
            views: z.number().nonnegative(),
            uploadDate: z.string(),
            url: z.string(),
            channel: z.string(),
        })
    ).min(1).max(60),
    comments: z.array(
        z.object({
            text: z.string().max(500),
            videoUrl: z.string().optional(),
        })
    ).max(150),
    searchResults: z.array(
        z.object({
            title: z.string(),
            channel: z.string(),
            views: z.number().nonnegative(),
            uploadDate: z.string(),
        })
    ).max(20),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

// AI output schema (strict enforcement)
export const GapItemSchema = z.object({
    title: z.string().min(5).max(150),
    gapScore: z.number().min(0).max(10),
    reasoning: z.string().min(20).max(500),
    hook: z.string().min(10).max(200),
    format: z.string().min(5).max(100),
    monetizationAngle: z.string().min(10).max(200),
});

export const GapOutputSchema = z.object({
    gaps: z.array(GapItemSchema).length(3),
});

export type GapItem = z.infer<typeof GapItemSchema>;
export type GapOutput = z.infer<typeof GapOutputSchema>;
