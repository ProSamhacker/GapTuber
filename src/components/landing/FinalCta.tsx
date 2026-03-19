"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function FinalCta() {
    const { data: session } = useSession();

    return (
        <section className="py-16 sm:py-28 px-4 bg-[#0a0a0f] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-600/12 rounded-full -translate-y-1/2 translate-x-1/4 blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-[80px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 glass-purple rounded-full px-4 py-1.5 mb-7">
                    <span className="w-2 h-2 bg-violet-400 rounded-full radar-dot" />
                    <span className="text-sm font-medium text-violet-300">Ready to find your next big video?</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-white mb-5 leading-tight glow-text">
                    Your Competitors Are Guessing.
                    <br />
                    <span className="shimmer-text">You Don&apos;t Have To.</span>
                </h2>
                <p className="text-gray-400 text-lg mb-12 leading-relaxed">
                    Run your first gap scan in minutes and discover untapped content opportunities
                    with statistical confidence.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {session ? (
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all hover:shadow-2xl hover:shadow-violet-500/40 active:scale-95 glow-purple"
                        >
                            <span className="w-2 h-2 bg-white/50 rounded-full radar-dot" />
                            Go to Dashboard →
                        </Link>
                    ) : (
                        <Link
                            href="/auth/signin"
                            className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-bold text-base hover:opacity-90 transition-all hover:shadow-2xl hover:shadow-violet-500/40 active:scale-95 glow-purple"
                        >
                            <span className="w-2 h-2 bg-white/50 rounded-full radar-dot" />
                            Get Started — Free
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
