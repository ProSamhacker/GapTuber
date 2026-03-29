const ROWS = [
    { feature: "Channel analysis (500+ videos)", us: true, vidiq: true,  tubebuddy: false },
    { feature: "Statistical gap detection",       us: true, vidiq: false, tubebuddy: false },
    { feature: "Wilson score engagement",          us: true, vidiq: false, tubebuddy: false },
    { feature: "SEO audit (title + desc + tags)",  us: true, vidiq: true,  tubebuddy: true  },
    { feature: "AI tag generator (50 tags)",       us: true, vidiq: true,  tubebuddy: true  },
    { feature: "Thumbnail AI concepts",            us: true, vidiq: false, tubebuddy: false },
    { feature: "Upload schedule optimizer",        us: true, vidiq: false, tubebuddy: false },
    { feature: "Frustration NLP analysis",         us: true, vidiq: false, tubebuddy: false },
    { feature: "Content outline generator",        us: true, vidiq: false, tubebuddy: false },
    { feature: "Free to use",                      us: true, vidiq: false, tubebuddy: false },
];

const Tick = ({ on, highlight }: { on: boolean; highlight?: boolean }) =>
    on ? (
        <span className={`inline-block w-5 h-5 rounded-full text-center leading-5 text-xs font-bold ${highlight ? "bg-emerald-600 text-white" : "text-emerald-400"}`}>
            {highlight ? "✓" : "✓"}
        </span>
    ) : (
        <span className="text-zinc-800 text-sm">—</span>
    );

export default function WhySection() {
    return (
        <section id="why-gaptuber" className="py-20 px-5 bg-[#0c0c0e] border-t border-[#1e1e22]">
            <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                    <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-5">Comparison</p>
                    <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
                        Why GapTuber beats VidIQ & TubeBuddy.
                    </h2>
                    <p className="text-zinc-500 text-sm">More features. Statistical accuracy. Free during early access.</p>
                </div>

                <div className="border border-[#1e1e22] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[#1e1e22]">
                                <th className="text-left px-5 py-3.5 text-xs font-mono text-zinc-600 uppercase tracking-widest w-1/2">Feature</th>
                                <th className="px-4 py-3.5 text-center">
                                    <span className="text-xs font-semibold text-white bg-emerald-600 px-3 py-1 rounded-md">GapTuber</span>
                                </th>
                                <th className="px-4 py-3.5 text-center text-xs font-mono text-zinc-600 uppercase">VidIQ</th>
                                <th className="px-4 py-3.5 text-center text-xs font-mono text-zinc-600 uppercase">TubeBuddy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ROWS.map((row, i) => (
                                <tr key={row.feature} className={`border-b border-[#1e1e22] last:border-0 ${i % 2 === 1 ? "bg-[#111113]" : ""}`}>
                                    <td className="px-5 py-3 text-zinc-400">{row.feature}</td>
                                    <td className="px-4 py-3 text-center"><Tick on={row.us} highlight /></td>
                                    <td className="px-4 py-3 text-center"><Tick on={row.vidiq} /></td>
                                    <td className="px-4 py-3 text-center"><Tick on={row.tubebuddy} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-zinc-700 mt-4">
                    * VidIQ and TubeBuddy require paid plans for most features.
                </p>
            </div>
        </section>
    );
}
