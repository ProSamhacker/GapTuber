const BEFORE = [
    "Searching trending topics and copying them",
    "Using generic keyword tools everyone else uses",
    "Guessing from view counts with no signal context",
    "Blindly copying competitors' best-performing videos",
];

const AFTER = [
    { icon: "⚡", label: "Velocity detection", desc: "Find channels gaining momentum before they peak." },
    { icon: "😤", label: "Frustration mining", desc: "NLP analysis of comment pain points to find what viewers hate about existing content." },
    { icon: "🎯", label: "Gap scoring engine", desc: "7 signals combined into a 0–10 score. Not vibes — math." },
    { icon: "⏱", label: "Upload timing", desc: "Knows exactly when your specific audience is watching." },
];

export default function ProblemSection() {
    return (
        <section className="py-20 px-5 bg-[#0c0c0e]">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Left — The problem */}
                    <div>
                        <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-5">The problem</p>
                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                            You're not losing views.<br />You're missing signals.
                        </h2>
                        <p className="text-zinc-500 text-base mb-8 leading-relaxed">
                            By the time a topic "looks hot," it's already saturated. Most tools tell you what's already working — that's too late.
                        </p>
                        <div className="space-y-3">
                            <p className="text-xs font-mono text-zinc-600 uppercase mb-3">What most creators rely on</p>
                            {BEFORE.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-zinc-500">
                                    <span className="text-zinc-700 mt-0.5 flex-shrink-0">–</span>
                                    <span className="text-sm">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — The solution */}
                    <div className="border-l border-[#1e1e22] pl-12 lg:pl-16">
                        <p className="text-xs font-mono text-emerald-400 tracking-widest uppercase mb-5">What GapTuber does</p>
                        <div className="space-y-7">
                            {AFTER.map(item => (
                                <div key={item.label} className="flex gap-4">
                                    <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-200 mb-1">{item.label}</p>
                                        <p className="text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
