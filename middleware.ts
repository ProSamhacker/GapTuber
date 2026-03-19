import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    if (pathname.startsWith("/dashboard") && !session) {
        const signInUrl = new URL("/auth/signin", req.url);
        signInUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(signInUrl);
    }
    
    // Redirect un-onboarded users (those with 0 channels)
    // @ts-ignore
    if (pathname.startsWith("/dashboard") && session?.user?.hasChannels === false) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
    }
    
    // Redirect onboarded users away from onboarding unless forced
    if (pathname.startsWith("/onboarding") && session && !req.nextUrl.searchParams.has("force")) {
        // @ts-ignore
        if (session.user.hasChannels === true) {
             return NextResponse.redirect(new URL("/dashboard", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: ["/dashboard/:path*", "/onboarding/:path*"],
};
