import Link from "next/link";

export default function FinalCta() {
    return (
        <section className="py-24 px-4 bg-gradient-to-br from-blue-600 to-emerald-700 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative max-w-3xl mx-auto text-center">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
                    Your Competitors Are Guessing.
                    <br />
                    <span className="text-blue-200">You Don&apos;t Have To.</span>
                </h2>
                <p className="text-blue-100 text-lg mb-10">
                    Run your first scan in minutes.
                </p>
                <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-3 bg-white text-blue-700 px-10 py-4 rounded-xl font-bold text-base hover:bg-blue-50 transition-all hover:shadow-2xl active:scale-95"
                >
                    <span className="w-2 h-2 bg-blue-500 rounded-full radar-dot" />
                    Start Free Gap Scan
                </Link>
                <p className="text-blue-300 text-sm mt-5">No credit card required.</p>
            </div>
        </section>
    );
}
