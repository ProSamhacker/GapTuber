"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function FinalCta() {
    const { data: session } = useSession();

    return (
        <section className="py-24 px-5 bg-[#111113] border-t border-[#1e1e22]">
            <div className="max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                    <div>
                        <p className="text-xs font-mono text-zinc-600 tracking-widest uppercase mb-5">Ship your next video</p>
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Your competitors<br />are guessing.
                        </h2>
                        <p className="text-zinc-500 text-base leading-relaxed max-w-md">
                            Run your first gap scan in minutes. Get a statistical confidence score, a ready-to-use hook, and a content outline — before anyone else spots the opportunity.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:justify-end gap-3">
                        {session ? (
                            <Link
                                href="/dashboard"
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-md font-semibold text-sm transition-colors text-center"
                            >
                                Open Dashboard →
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/auth/signin"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-md font-semibold text-sm transition-colors text-center"
                                >
                                    Start for free →
                                </Link>
                                <Link
                                    href="#how-it-works"
                                    className="border border-[#2a2a30] hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 px-8 py-3 rounded-md text-sm transition-colors text-center"
                                >
                                    See how it works
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
