const STATS = [
    { value: "332+", label: "Reddit views in 24h post" },
    { value: "50K+", label: "Views from a single gap signal" },
    { value: "9.1", label: "Top gap score recorded" },
];

const QUOTES = [
    {
        text: "This showed me angles I completely overlooked. Found a gap with a 9.1 score that no one was covering.",
        who: "Beta Tech Creator · 12k subs",
    },
    {
        text: "Finally something beyond keyword suggestions. The statistical gap scoring is a game-changer.",
        who: "AI Reviewer · Tech & AI niche",
    },
    {
        text: "I found a gap with 8.9 score that had no competition. Posted it — hit 50k views in a week.",
        who: "Developer Educator · 45k subs",
    },
];

export default function SocialProof() {
    return (
        <section className="py-20 px-5 bg-[#0c0c0e] border-t border-[#1e1e22]">
            <div className="max-w-6xl mx-auto">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-0 border border-[#1e1e22] rounded-xl overflow-hidden mb-16">
                    {STATS.map((s, i) => (
                        <div
                            key={s.label}
                            className={`px-8 py-7 ${i < STATS.length - 1 ? "border-r border-[#1e1e22]" : ""}`}
                        >
                            <p className="text-4xl font-extrabold text-white mb-1 tracking-tight">{s.value}</p>
                            <p className="text-sm text-zinc-500">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quotes */}
                <div className="mb-6">
                    <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-8">Early feedback</p>
                    <div className="grid md:grid-cols-3 gap-6">
                        {QUOTES.map((q, i) => (
                            <div key={i} className="border-l-2 border-emerald-600 pl-5">
                                <p className="text-sm text-zinc-400 leading-relaxed mb-3">"{q.text}"</p>
                                <p className="text-xs text-zinc-600 font-mono">{q.who}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reddit mention */}
                <div className="mt-10 flex items-start gap-4 bg-[#111113] border border-[#1e1e22] rounded-xl p-5">
                    <span className="flex-shrink-0 text-orange-500 font-bold text-sm font-mono mt-0.5">r/NewTubers</span>
                    <p className="text-sm text-zinc-400 italic">
                        "Niice, it looks useful for sure!! Been looking for something like this for ages." —{" "}
                        <span className="text-zinc-600 not-italic">Any_Fisherman_2877</span>
                    </p>
                </div>
            </div>
        </section>
    );
}
