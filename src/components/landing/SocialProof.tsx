const testimonials = [
    {
        quote: "This showed me angles I completely overlooked.",
        author: "Beta Tech Creator",
        handle: "@techcreator",
    },
    {
        quote: "Finally something beyond generic keyword suggestions.",
        author: "AI Reviewer",
        handle: "@aireviewer",
    },
    {
        quote: "I found a gap with 8.9 score that had no competition. Video hit 50k views.",
        author: "Developer Educator",
        handle: "@deveducator",
    },
];

export default function SocialProof() {
    return (
        <section className="py-20 px-4 bg-white">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        Early Creators <span className="text-blue-600">Are Saying…</span>
                    </h2>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                    {testimonials.map((t) => (
                        <div
                            key={t.handle}
                            className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                            {/* Quote marks */}
                            <div className="text-blue-400 text-4xl font-serif leading-none mb-3">&ldquo;</div>
                            <p className="text-gray-700 text-sm leading-relaxed mb-4">{t.quote}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 text-xs font-bold">
                                        {t.author[0]}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">{t.author}</div>
                                    <div className="text-xs text-gray-400">{t.handle}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
