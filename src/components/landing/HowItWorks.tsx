const STEPS = [
    {
        num: "01",
        title: "Channel deep analysis",
        desc: "Point GapTuber at any YouTube channel with 500+ videos. We pull view velocity, engagement rates via Wilson score intervals, revenue estimates, upload consistency — from real API data.",
        details: ["Bayesian engagement scoring", "EMA trend detection", "Revenue estimate by niche CPM", "Upload schedule analysis"],
    },
    {
        num: "02",
        title: "Statistical gap detection",
        desc: "Our 7-signal engine uses exponential decay weighting, TF-IDF keyword relevance, and frustration NLP to surface gaps with statistical confidence. No guessing.",
        details: ["Wilson score engagement reliability", "Exponential decay velocity", "TF-IDF keyword relevance", "Comment frustration NLP"],
    },
    {
        num: "03",
        title: "SEO & tag optimisation",
        desc: "Deterministic SEO scorer on your video's title, description, and tags. Get a 0–100 score, AI-improved title variants, 50 optimised tags, and competitor tag extraction.",
        details: ["Title SEO scoring 0–100", "Keyword density analysis", "50 AI-generated tags", "Competitor tag extraction"],
    },
    {
        num: "04",
        title: "Thumbnail & revenue intelligence",
        desc: "AI thumbnail concepts with colour psychology and CTR benchmarks. Revenue projections based on your niche's actual CPM data — not made-up averages.",
        details: ["3 thumbnail concepts", "CTR optimisation tips", "Niche CPM benchmarks", "Monthly revenue projections"],
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 px-5 bg-[#111113] border-t border-[#1e1e22]">
            <div className="max-w-6xl mx-auto">
                <div className="mb-14 max-w-xl">
                    <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-5">How it works</p>
                    <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                        From noise to opportunity<br />in under 60 seconds.
                    </h2>
                    <p className="text-zinc-500 text-base">
                        A hybrid deterministic + AI system. Every signal has a reason.
                    </p>
                </div>

                <div className="space-y-0">
                    {STEPS.map((step, i) => (
                        <div
                            key={step.num}
                            className={`grid lg:grid-cols-[80px_1fr_1fr] gap-0 border-t border-[#1e1e22] py-10 ${i === STEPS.length - 1 ? "border-b" : ""}`}
                        >
                            {/* Step number */}
                            <div className="mb-4 lg:mb-0">
                                <span className="text-xs font-mono text-zinc-700">{step.num}</span>
                            </div>
                            {/* Title + desc */}
                            <div className="lg:pr-12 mb-4 lg:mb-0">
                                <h3 className="text-base font-semibold text-zinc-100 mb-2">{step.title}</h3>
                                <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
                            </div>
                            {/* Detail list */}
                            <div className="space-y-2 lg:border-l lg:border-[#1e1e22] lg:pl-12">
                                {step.details.map(d => (
                                    <div key={d} className="flex items-center gap-2 text-sm text-zinc-400">
                                        <span className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                                        {d}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
