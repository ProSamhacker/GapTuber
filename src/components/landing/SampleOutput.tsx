export default function SampleOutput() {
    return (
        <section id="sample-output" className="py-20 px-4 bg-white">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        What a Real Gap <span className="text-blue-600">Looks Like.</span>
                    </h2>
                    <p className="text-gray-500">
                        This is an example output from a scan on the keyword &ldquo;RAG tutorial.&rdquo;
                    </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all overflow-hidden">
                    {/* Header bar */}
                    <div className="bg-gradient-to-r from-blue-600 to-emerald-500 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-300 rounded-full radar-dot" />
                            <span className="text-white text-sm font-medium">Gap #1 — Detected Opportunity</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-white/80 text-xs">Gap Score</span>
                            <span className="bg-white/20 text-white text-sm font-bold px-2.5 py-0.5 rounded-full">
                                8.7 / 10
                            </span>
                        </div>
                    </div>

                    <div className="p-7">
                        {/* Title */}
                        <h3 className="text-xl font-bold text-gray-900 mb-5">
                            &ldquo;Beginner-Friendly RAG Tutorial for Solo Developers (2026 Updated Stack)&rdquo;
                        </h3>

                        {/* Signal grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            {[
                                { label: "Velocity", value: "High", sub: "2 videos trending" },
                                { label: "Saturation", value: "Low", sub: "3 uploads / 30d" },
                                { label: "Frustration", value: "High", sub: "Outdated tutorials" },
                                { label: "Abandonment", value: "Medium", sub: "No 2026 version" },
                            ].map((metric) => (
                                <div key={metric.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <div className="text-xs text-gray-400 font-medium mb-1">{metric.label}</div>
                                    <div className="text-sm font-bold text-gray-900">{metric.value}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{metric.sub}</div>
                                </div>
                            ))}
                        </div>

                        {/* Why This Works */}
                        <div className="mb-5">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Why This Works
                            </h4>
                            <ul className="space-y-1.5">
                                {[
                                    "High comment frustration around outdated tutorials",
                                    "Only 3 uploads in last 30 days",
                                    "2 competitor videos showing strong velocity",
                                    "No clear beginner-focused version exists",
                                ].map((reason) => (
                                    <li key={reason} className="flex items-start gap-2 text-sm text-gray-600">
                                        <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold">
                                            ✓
                                        </span>
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Hook & Monetization */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">
                                    🎣 Suggested Hook
                                </div>
                                <p className="text-sm text-gray-700 italic">
                                    &ldquo;Stop Copy-Pasting RAG Tutorials That Don&apos;t Work in 2026.&rdquo;
                                </p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    💰 Monetization Angle
                                </div>
                                <p className="text-sm text-gray-700">
                                    Promote hosting provider + vector database tools (e.g., Pinecone, Supabase pgvector).
                                </p>
                            </div>
                        </div>

                        {/* Format */}
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-medium text-gray-700">📹 Format:</span>
                            15-min beginner tutorial with timestamps + GitHub repo link
                        </div>
                    </div>
                </div>

                <p className="text-center text-sm text-gray-400 mt-6">
                    This is strategic advantage. Not another keyword suggestion.
                </p>
            </div>
        </section>
    );
}
