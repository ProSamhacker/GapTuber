import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { upsertUser, getUserByEmail, getChannelsByUserId } from "@/db/queries";

export const { handlers, auth: originalAuth, signIn, signOut } = NextAuth({
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            if (!user.email) return false;
            try {
                await upsertUser(
                    user.email,
                    user.name ?? undefined,
                    user.image ?? undefined
                );
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
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.sub = user.id;
                if (user.email) token.email = user.email;
                if (user.name) token.name = user.name;
                
                try {
                    let dbUser = await getUserByEmail(user.email!);
                    if (!dbUser) {
                        // Safety net: construct user if they somehow skipped signIn callback
                        dbUser = await upsertUser(user.email!, user.name ?? undefined, user.image ?? undefined);
                    }
                    if (dbUser) {
                        token.sub = dbUser.id; // Enforce DB UUID as the session ID
                        const channels = await getChannelsByUserId(dbUser.id);
                        token.hasChannels = channels.length > 0;
                    }
                } catch (e) {
                    console.error("Failed to sync DB user for JWT", e);
                }
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

export const auth = async (...args: any[]) => {
    // AUTO-LOGIN BYPASS FOR TESTING (dev only)
    if (process.env.NODE_ENV === "development") {
        try {
            const dbUser = await upsertUser(
                "browser-test@example.com",
                "Browser Test Runner",
                "https://api.dicebear.com/7.x/avataaars/svg?seed=BrowserTest"
            );
            return {
                user: {
                    id: dbUser.id,
                    email: dbUser.email,
                    name: dbUser.name,
                    image: dbUser.image,
                    hasChannels: true,
                },
                expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            } as any;
        } catch {
            // Fallback — return a dummy (won't hit DB features)
            return null;
        }
    }
    return originalAuth(...args as Parameters<typeof originalAuth>);
};
