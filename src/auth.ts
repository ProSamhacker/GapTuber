import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByEmail, getChannelsByUserId, updateChannelYoutubeTokens } from "@/db/queries";
import { cookies } from "next/headers";

export const { handlers, auth: originalAuth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: {
                    scope: [
                        "openid",
                        "email",
                        "profile",
                        "https://www.googleapis.com/auth/youtube.readonly",
                    ].join(" "),
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (!user.email) return false;
            try {
                const dbUser = await upsertUser(
                    user.email,
                    user.name ?? undefined,
                    user.image ?? undefined
                );
                
                // Read the target channel ID cookie set before OAuth redirect
                const cookieStore = await cookies();
                const targetChannelId = cookieStore.get("connect_channel_id")?.value;

                // Save YouTube OAuth tokens specifically to the target channel project
                if (targetChannelId && account?.access_token) {
                    await updateChannelYoutubeTokens(targetChannelId, {
                        accessToken: account.access_token,
                        refreshToken: account.refresh_token ?? null,
                        expiresAt: account.expires_at
                            ? new Date(account.expires_at * 1000)
                            : null,
                    });
                }
            } catch (err) {
                console.error("[Auth] DB upsert failed (non-blocking):", err);
            }
            return true;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                // @ts-ignore
                session.user.hasChannels = token.hasChannels === true;
            }
            return session;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (user) {
                token.sub = user.id;
                if (user.email) token.email = user.email;
                if (user.name) token.name = user.name;
                
                try {
                    let dbUser = await getUserByEmail(user.email!);
                    if (!dbUser) {
                        dbUser = await upsertUser(user.email!, user.name ?? undefined, user.image ?? undefined);
                    }
                    if (dbUser) {
                        token.sub = dbUser.id;
                        const channels = await getChannelsByUserId(dbUser.id);
                        token.hasChannels = channels.length > 0;
                    }
                } catch (e) {
                    console.error("Failed to sync DB user for JWT", e);
                }
            }

            // Persist access token to token for downstream use if needed
            if (account?.access_token) {
                token.youtubeAccessToken = account.access_token;
            }
            
            if (trigger === "update" && session) {
                token.hasChannels = session.hasChannels;
            }
            
            return token;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
    secret: process.env.AUTH_SECRET,
});

export const auth = originalAuth;
