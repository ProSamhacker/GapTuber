import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { scans } from "@/db/schema";
import { getUserByEmail, getChannelsByUserId } from "@/db/queries";
import type { ScanResult, ScanAnalytics } from "@/db/schema";

// Node.js runtime (not edge) — required so we can self-fetch /api/auth/session
// to resolve the user from the Auth.js v5 JWE session token sent by the extension.

function getCorsHeaders(req: NextRequest): Record<string, string> {
    const origin = req.headers.get("origin") ?? "*";
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Session-Cookie",
    };
}

export async function OPTIONS(req: NextRequest) {
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
    const cors = getCorsHeaders(req);
    console.log("[SaveScan] → POST received");

    try {
        let userEmail: string | null = null;

        // ── Step 1: Try standard auth() (works when browser sends cookies directly) ──
        try {
            const session = await auth();
            userEmail = session?.user?.email ?? null;
            console.log("[SaveScan] Step1 auth():", userEmail ?? "null");
        } catch (e) {
            console.log("[SaveScan] Step1 auth() threw:", String(e).slice(0, 100));
        }

        // ── Step 2: Forward X-Session-Cookie to /api/auth/session ─────────────────
        if (!userEmail) {
            const cookieValue = req.headers.get("X-Session-Cookie");
            console.log("[SaveScan] Step2 X-Session-Cookie present:", !!cookieValue);

            if (cookieValue) {
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
                const cookieNames = ["authjs.session-token", "__Secure-authjs.session-token"];

                for (const name of cookieNames) {
                    try {
                        const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
                            headers: { Cookie: `${name}=${cookieValue}` },
                        });
                        const sessionData = await sessionRes.json() as { user?: { email?: string } };
                        console.log(`[SaveScan] Step2 ${name} →`, sessionData?.user?.email ?? "no email");
                        if (sessionData?.user?.email) {
                            userEmail = sessionData.user.email;
                            break;
                        }
                    } catch (e) {
                        console.log(`[SaveScan] Step2 ${name} fetch error:`, String(e).slice(0, 100));
                    }
                }
            }
        }

        console.log("[SaveScan] Final resolved email:", userEmail ?? "null");

        if (!userEmail) {
            return NextResponse.json(
                { success: false, error: "Unauthorized — reload extension after signing in at localhost:3000" },
                { status: 401, headers: cors }
            );
        }

        const user = await getUserByEmail(userEmail);
        if (!user) {
            console.log("[SaveScan] User not found in DB for email:", userEmail);
            return NextResponse.json(
                { success: false, error: "User not found in DB" },
                { status: 404, headers: cors }
            );
        }

        const userChannels = await getChannelsByUserId(user.id);
        if (userChannels.length === 0) {
            return NextResponse.json(
                { success: false, error: "No channel found. Please complete AuraIQ onboarding first." },
                { status: 400, headers: cors }
            );
        }
        const targetChannelId = userChannels[0].id;

        // ── Parse body ──────────────────────────────────────────────────────────────
        const body = await req.json() as {
            keyword: string;
            competitors?: string[];
            result: ScanResult;
            analytics?: ScanAnalytics | null;
            rawData?: Record<string, unknown>;
        };

        if (!body.keyword || !body.result?.gaps?.length) {
            return NextResponse.json(
                { success: false, error: "keyword and gaps required" },
                { status: 400, headers: cors }
            );
        }

        // ── Insert ──────────────────────────────────────────────────────────────────
        const [saved] = await db.insert(scans).values({
            userId: user.id,
            channelId: targetChannelId,
            keyword: body.keyword,
            competitors: body.competitors ?? [],
            rawData: body.rawData ?? {},
            result: body.result,
            analytics: body.analytics ?? null,
        }).returning({ id: scans.id });

        console.log(`[SaveScan] ✅ ${saved?.id} for ${userEmail} — "${body.keyword}"`);
        return NextResponse.json({ success: true, id: saved?.id }, { headers: cors });

    } catch (err) {
        console.error("[SaveScan Error]", err);
        return NextResponse.json(
            { success: false, error: "Internal error" },
            { status: 500, headers: cors }
        );
    }
}
