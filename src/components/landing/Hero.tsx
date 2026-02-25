import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-white pointer-events-none" />
            <div className="absolute top-20 right-0 w-96 h-96 bg-blue-100 rounded-full opacity-20 blur-3xl pointer-events-none" />

            <div className="relative max-w-4xl mx-auto text-center">
                {/* Label */}
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
                    <span className="w-2 h-2 bg-blue-500 rounded-full radar-dot" />
                    <span className="text-sm font-medium text-blue-700">
                        Strategic YouTube Intelligence
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6 animate-fade-in">
                    Stop Guessing{" "}
                    <span className="text-blue-600">What to Upload</span> Next.
                </h1>

                {/* Subheadline */}
                <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-delay">
                    AI Gap Radar analyzes competitor velocity, audience frustration, and
                    topic saturation to reveal high-opportunity YouTube content gaps —
                    before your competitors see them.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-delay-2">
                    <Link
                        href="/auth/signin"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200 active:scale-95"
                    >
                        <span className="w-2 h-2 bg-blue-300 rounded-full radar-dot" />
                        Run Your First Gap Scan
                    </Link>
                    <Link
                        href="#how-it-works"
                        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-medium text-base hover:border-blue-400 hover:text-blue-700 transition-colors"
                    >
                        View How It Works →
                    </Link>
                </div>

                {/* Trust line */}
                <p className="text-sm text-gray-400 animate-fade-in-delay-2">
                    Built for Tech & AI creators who want smarter growth — not random uploads.
                </p>

                {/* Social trust badges */}
                <div className="mt-12 flex items-center justify-center gap-8 flex-wrap opacity-60">
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-gray-500 font-medium">No credit card</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-gray-500 font-medium">Deterministic + AI hybrid engine</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        <span className="text-sm text-gray-500 font-medium">Results in minutes</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
