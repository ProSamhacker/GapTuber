import Link from "next/link";
import { auth } from "@/auth";

const TOOLS = [
    { label: "Gap Scanner", desc: "Statistical content gap detection" },
    { label: "Channel Analysis", desc: "500+ video deep-dive" },
    { label: "SEO Auditor", desc: "Title, tags & description scoring" },
    { label: "Tag Generator", desc: "50 AI-optimised tags" },
    { label: "Thumbnail AI", desc: "Colour-psychology concepts" },
    { label: "Upload Scheduler", desc: "Best time to post" },
];

const SAMPLE_GAP = {
    keyword: "rag tutorial",
    title: "Beginner-Friendly RAG for Solo Devs (2026 Stack)",
    score: "8.7",
    signals: [
        { k: "Velocity", v: "High" },
        { k: "Saturation", v: "Low" },
        { k: "Frustration", v: "High" },
        { k: "Competition", v: "Easy" },
    ],
    hook: '"Stop using RAG tutorials from 2023."',
};

export default async function Hero() {
    const session = await auth();
    return (
        <section className="pt-24 pb-16 px-5 border-b border-[#1e1e22]">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left — Copy */}
                    <div className="pt-6">
                        <p className="text-xs font-mono text-emerald-400 mb-6 tracking-widest uppercase">
                            YouTube Intelligence Suite · 6 tools
                        </p>
                        <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                            Find the gap before<br />
                            your competitors do.
                        </h1>
                        <p className="text-zinc-400 text-lg leading-relaxed mb-8 max-w-md">
                            GapTuber scans competitor channels with a 7-signal statistical engine and surfaces content opportunities your competitors haven't touched yet.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mb-10">
                            {session ? (
                                <Link
                                    href="/dashboard"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-md font-semibold text-sm transition-colors"
                                >
                                    Open Dashboard →
                                </Link>
                            ) : (
                                <Link
                                    href="/auth/signin"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-md font-semibold text-sm transition-colors"
                                >
                                    Start for free →
                                </Link>
                            )}
                            <Link href="#how-it-works" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                                How it works
                            </Link>
                        </div>
                        {/* Tool list */}
                        <div className="border-t border-[#1e1e22] pt-6">
                            <p className="text-xs text-zinc-600 font-mono mb-4">WHAT'S INCLUDED</p>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {TOOLS.map(t => (
                                    <div key={t.label}>
                                        <span className="text-sm font-medium text-zinc-300">{t.label}</span>
                                        <p className="text-xs text-zinc-600 mt-0.5">{t.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right — Sample Terminal Card */}
                    <div className="bg-[#111113] border border-[#1e1e22] rounded-xl overflow-hidden font-mono text-sm mt-4">
                        {/* Terminal bar */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e1e22]">
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                            <span className="ml-3 text-xs text-zinc-600">gap_scan → "{SAMPLE_GAP.keyword}"</span>
                        </div>
                        {/* Output */}
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-zinc-600 text-xs mb-1">GAP #1 · SCORE</p>
                                <p className="text-emerald-400 text-3xl font-extrabold">{SAMPLE_GAP.score}<span className="text-zinc-700 text-lg">/10</span></p>
                            </div>
                            <div>
                                <p className="text-zinc-600 text-xs mb-1">SUGGESTED TITLE</p>
                                <p className="text-zinc-200 text-[13px] leading-snug">{SAMPLE_GAP.title}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {SAMPLE_GAP.signals.map(s => (
                                    <div key={s.k} className="bg-[#0c0c0e] border border-[#1e1e22] rounded-lg px-3 py-2">
                                        <p className="text-zinc-600 text-[10px]">{s.k}</p>
                                        <p className={`text-xs font-semibold mt-0.5 ${s.v === "High" || s.v === "Easy" ? "text-emerald-400" : s.v === "Low" ? "text-amber-400" : "text-zinc-300"}`}>{s.v}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-[#1e1e22] pt-3">
                                <p className="text-zinc-600 text-[10px] mb-1">HOOK</p>
                                <p className="text-zinc-300 text-[13px] italic">{SAMPLE_GAP.hook}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
