import Link from "next/link";
import { auth } from "@/auth";

const FEATURES = [
    { icon: "📊", label: "Channel Analysis" },
    { icon: "🎯", label: "Gap Scanner" },
    { icon: "🔍", label: "SEO Auditor" },
    { icon: "🏷️", label: "Tag Generator" },
    { icon: "🖼️", label: "Thumbnail AI" },
    { icon: "📅", label: "Upload Scheduler" },
];

export default async function Hero() {
    const session = await auth();
    return (
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-28 px-4 overflow-hidden bg-[#0a0a0f]">
            {/* Animated mesh gradient background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] glow-pulse" />
                <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] glow-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute bottom-0 left-[30%] w-[300px] h-[300px] bg-sky-600/10 rounded-full blur-[80px] glow-pulse" style={{ animationDelay: "2s" }} />
                {/* Grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
            </div>

            <div className="relative max-w-5xl mx-auto text-center">
                {/* Label */}
                <div className="animate-fade-in-delay">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-7">
                        <span className="w-2 h-2 bg-violet-500 rounded-full radar-dot" />
                        <span className="text-sm font-medium text-gray-300">
                            YouTube Intelligence Suite — 5 Powerful AI Tools
                        </span>
                    </div>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6 animate-fade-in-delay-2">
                    Find Your Next{" "}
                    <span className="shimmer-text">Viral Gap</span>
                    {" "}Before Anyone Else.
                </h1>

                {/* Subheadline */}
                <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed animate-fade-in-delay-3">
                    AuraIQ scans competitor channels using statistical algorithms and AI to surface
                    untapped YouTube content opportunities — before your competitors see them.
                </p>

                {/* Feature Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-2xl mx-auto mb-12 animate-fade-in-delay-3">
                    {FEATURES.map(f => (
                        <div
                            key={f.label}
                            className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all cursor-default"
                        >
                            <span className="text-sm">{f.icon}</span>
                            <span className="text-sm font-medium text-gray-300">{f.label}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    {session ? (
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-all hover:shadow-xl hover:shadow-violet-500/30 active:scale-95 glow-purple"
                        >
                            <span className="w-2 h-2 bg-white/60 rounded-full radar-dot" />
                            Go to Dashboard &rarr;
                        </Link>
                    ) : (
                        <Link
                            href="/auth/signin"
                            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-all hover:shadow-xl hover:shadow-violet-500/30 active:scale-95 glow-purple"
                        >
                            <span className="w-2 h-2 bg-white/60 rounded-full radar-dot" />
                            Get Started — Free
                        </Link>
                    )}
                    <Link
                        href="#how-it-works"
                        className="inline-flex items-center gap-2 glass border border-white/10 text-gray-300 px-8 py-4 rounded-xl font-medium text-base hover:border-violet-500/40 hover:text-white transition-all"
                    >
                        See How It Works &rarr;
                    </Link>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-6 flex-wrap">
                    {["No credit card required", "Hybrid AI + statistical engine", "Results in under 60s", "Beats VidIQ & TubeBuddy"].map(badge => (
                        <div key={badge} className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-400 font-medium">{badge}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
