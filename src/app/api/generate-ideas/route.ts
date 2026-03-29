import { NextRequest, NextResponse } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { auth } from "@/auth";
import { getChannelById, updateChannelBlueprint } from "@/db/queries";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { channelId, channelStats, recentVideos } = body;

        if (!channelId || !recentVideos || recentVideos.length === 0) {
            return NextResponse.json({ error: "Missing required data" }, { status: 400 });
        }

        const channel = await getChannelById(channelId);
        if (!channel || channel.userId !== session.user.id) {
            return NextResponse.json({ error: "Channel not found or unauthorized" }, { status: 404 });
        }

        const hasGroqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY_3;
        if (!hasGroqKey) {
            return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
        }

        // ── Format the real API data for the AI prompt ──────────────────────
        const topVideos = recentVideos
            .sort((a: any, b: any) => (parseInt(b.views) || 0) - (parseInt(a.views) || 0))
            .slice(0, 10)
            .map((v: any, i: number) => `  ${i + 1}. "${v.title}" — ${parseInt(v.views).toLocaleString()} views, ${parseInt(v.likes).toLocaleString()} likes`)
            .join("\n");

        const prompt = `You are an elite YouTube growth strategist.
        
TASK: Analyze this creator's actual recent performance data and generate exactly 5 highly-tailored, high-potential video ideas that perfectly match their proven audience.

CREATOR CHANNEL DATA:
- Channel Name: ${channelStats.title || "Unknown"}
- Subscribers: ${parseInt(channelStats.subscribers || "0").toLocaleString()}
- Total Views: ${parseInt(channelStats.views || "0").toLocaleString()}
- Total Videos: ${parseInt(channelStats.videoCount || "0").toLocaleString()}

THEIR TOP RECENT VIDEOS (Ground Truth API Data):
${topVideos}

YOUR TASK:
Based *only* on what is clearly working for this creator right now, generate 5 new video ideas that act as natural sequels, deeper dives, or better variations of their proven content.

RESPOND WITH ONLY THIS JSON SCHEMA:
{
  "videoIdeas": [
    {
      "title": "string (Catchy, clickable title)",
      "hook": "string (First 10 seconds script hook)",
      "format": "string (e.g., Tutorial, Vlog, Deep Dive)",
      "whyItWorks": "string (Explain why this fits their current audience)",
      "estimatedViewPotential": "high|medium|low",
      "targetAudience": "string"
    }
  ]
}`;

        const keys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3
        ].filter(Boolean) as string[];

        let rawText = "";
        let success = false;
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const activeKey of shuffledKeys) {
            try {
                const groq = createGroq({ apiKey: activeKey });
                const result = await generateText({
                    model: groq("llama-3.3-70b-versatile"),
                    messages: [
                        { role: "system", content: "You are a JSON API. Respond ONLY with valid JSON." },
                        { role: "user", content: prompt },
                    ],
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                });
                rawText = result.text;
                success = true;
                break;
            } catch (err) {
                console.warn("[Generate Ideas] Key failed, rotating...");
            }
        }

        if (!success) {
            return NextResponse.json({ error: "AI generation failed" }, { status: 503 });
        }

        const start = rawText.indexOf("{");
        const end = rawText.lastIndexOf("}");
        if (start === -1 || end <= start) throw new Error("No JSON found");
        
        const aiOutput = JSON.parse(rawText.slice(start, end + 1));
        const videoIdeas = aiOutput.videoIdeas;

        // Save immediately to database
        await updateChannelBlueprint(channelId, { videoIdeas });

        return NextResponse.json({ success: true, videoIdeas });

    } catch (err) {
        console.error("[GENERATE_IDEAS_ERROR]", err);
        return NextResponse.json({ error: "Failed to generate ideas." }, { status: 500 });
    }
}
