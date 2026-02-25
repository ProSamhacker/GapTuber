const problems = [
    "Random idea generation",
    "Generic keyword tools",
    "Guessing based on trends",
    "Copying competitors",
];

const solutions = [
    { icon: "⚡", label: "Velocity detection" },
    { icon: "😤", label: "Frustration mining" },
    { icon: "🎯", label: "Underserved angle discovery" },
    { icon: "⏱", label: "Strategic timing insight" },
];

export default function ProblemSection() {
    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        You&apos;re Not Losing Views.
                        <br />
                        <span className="text-blue-600">You&apos;re Missing Signals.</span>
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        By the time a topic &ldquo;looks hot,&rdquo; it&apos;s already saturated. What you need is what others can&apos;t see yet.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* What most creators do */}
                    <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-500 text-sm font-bold">✗</span>
                            </div>
                            <h3 className="font-semibold text-gray-700">What most creators rely on:</h3>
                        </div>
                        <ul className="space-y-3">
                            {problems.map((p) => (
                                <li key={p} className="flex items-center gap-3 text-gray-600">
                                    <span className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* What AuraIQ provides */}
                    <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">✓</span>
                            </div>
                            <h3 className="font-semibold text-gray-700">What AuraIQ provides:</h3>
                        </div>
                        <ul className="space-y-3">
                            {solutions.map((s) => (
                                <li key={s.label} className="flex items-center gap-3 text-gray-700">
                                    <span className="w-5 h-5 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                    <span className="font-medium">{s.icon} {s.label}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
