const audiences = [
    "Tech YouTubers (10k–200k subs)",
    "AI tool reviewers",
    "Developer educators",
    "Product breakdown channels",
];

const benefits = [
    { icon: "📈", title: "Long-term growth", desc: "Not random uploads — strategic positioning." },
    { icon: "🎯", title: "Authority building", desc: "Fill the gaps your competitors haven't noticed." },
    { icon: "💰", title: "Monetization efficiency", desc: "Target topics with real sponsorship angles." },
    { icon: "🧠", title: "Smarter decisions", desc: "Data-backed confidence, not gut feelings." },
];

export default function WhySection() {
    return (
        <section className="py-20 px-4 bg-gray-50">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-14">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Built for <span className="text-blue-600">Serious Creators.</span>
                    </h2>
                    <p className="text-gray-500 text-lg">Not for hobbyists.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-10 items-start">
                    {/* Audience */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                            Designed for:
                        </h3>
                        <ul className="space-y-3">
                            {audiences.map((a) => (
                                <li key={a} className="flex items-center gap-3 text-base text-gray-700 font-medium">
                                    <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </span>
                                    {a}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {benefits.map((b) => (
                            <div
                                key={b.title}
                                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                            >
                                <div className="text-2xl mb-2">{b.icon}</div>
                                <div className="font-semibold text-gray-900 mb-1">{b.title}</div>
                                <div className="text-sm text-gray-500">{b.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
