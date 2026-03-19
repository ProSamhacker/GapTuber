import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserByEmail, updateChannelBlueprint } from "@/db/queries";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await getUserByEmail(session.user.email);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const body = await req.json();
        const { channelId, videoIdeas, contentStrategy, marketSnapshot } = body;

        if (!channelId) {
            return NextResponse.json({ error: "channelId required" }, { status: 400 });
        }

        const updated = await updateChannelBlueprint(channelId, {
            videoIdeas,
            contentStrategy,
            marketSnapshot,
        });

        return NextResponse.json({ success: true, channel: updated });
    } catch (error) {
        console.error("[channel-blueprint] Error:", error);
        return NextResponse.json({ error: "Failed to update blueprint" }, { status: 500 });
    }
}
