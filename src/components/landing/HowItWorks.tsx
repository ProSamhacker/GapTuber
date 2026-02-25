const steps = [
    {
        number: "01",
        title: "Scan Competitors",
        description:
            "We analyze their latest videos, view velocity (views per day), topic patterns, and upload gaps. We detect what's accelerating — and what's being ignored.",
        details: ["View velocity per channel", "Topic pattern detection", "Upload gap analysis"],
        color: "bg-blue-50 border-blue-200",
        numColor: "text-blue-600",
    },
    {
        number: "02",
        title: "Mine Audience Frustrations",
        description:
            "We scan comment sections to identify repeated complaints, missing explanations, and requests for deeper coverage. Your next video should solve pain — not chase keywords.",
        details: ["Complaint phrase detection", "Recurring request identification", "Frustration scoring"],
        color: "bg-emerald-50 border-emerald-200",
        numColor: "text-emerald-600",
    },
    {
        number: "03",
        title: "Reveal Strategic Content Gaps",
        description:
            "You receive top 3 high-confidence opportunities with gap score, hook, format recommendation, and monetization angle. No vague ideas. Just actionable direction.",
        details: ["Gap score (data-backed)", "Suggested hook", "Monetization angle"],
        color: "bg-blue-50 border-blue-200",
        numColor: "text-blue-600",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-20 px-4 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        From Noise to Opportunity{" "}
                        <span className="text-blue-600">in Minutes.</span>
                    </h2>
                    <p className="text-gray-500 text-lg">
                        A hybrid deterministic + AI system. No guessing.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200 -translate-x-1/2" />

                    <div className="space-y-12">
                        {steps.map((step, i) => (
                            <div
                                key={step.number}
                                className={`relative flex flex-col md:flex-row gap-8 items-start md:items-center ${i % 2 === 1 ? "md:flex-row-reverse" : ""
                                    }`}
                            >
                                {/* Number bubble */}
                                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-white border-2 border-blue-300 rounded-full items-center justify-center z-10">
                                    <span className="text-sm font-bold text-blue-600">{step.number}</span>
                                </div>

                                {/* Card */}
                                <div className={`md:w-[calc(50%-3rem)] rounded-2xl border p-7 ${step.color}`}>
                                    <div className={`text-3xl font-extrabold mb-2 ${step.numColor} md:hidden`}>
                                        {step.number}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                    <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                                    <ul className="space-y-1.5">
                                        {step.details.map((d) => (
                                            <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
                                                <span className="w-4 h-4 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </span>
                                                {d}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Spacer on the other side */}
                                <div className="hidden md:block md:w-[calc(50%-3rem)]" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
