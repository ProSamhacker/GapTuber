"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <img src="/auraiq-logo.png" alt="AuraIQ Logo" className="w-10 h-10 object-contain" />
                    <span className="text-base font-bold text-white tracking-tight">AuraIQ</span>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#why-auraiq" className="text-sm text-gray-400 hover:text-white transition-colors">
                        Why AuraIQ
                    </Link>
                    <Link href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
                        How It Works
                    </Link>
                    {session ? (
                        <Link href="/dashboard" className="text-sm text-violet-400 font-semibold hover:text-violet-300 transition-colors">
                            Enter Dashboard &rarr;
                        </Link>
                    ) : (
                        <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-white transition-colors">
                            Get Started
                        </Link>
                    )}
                </div>

                {/* Auth CTA */}
                <div className="flex items-center gap-3">
                    {session ? (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                {session.user?.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name ?? "User"}
                                        className="w-7 h-7 rounded-full ring-1 ring-violet-500/40"
                                    />
                                )}
                                <span className="text-sm text-gray-300 hidden sm:block">
                                    {session.user?.name?.split(" ")[0]}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-sm text-gray-500 hover:text-white transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-white transition-colors">
                                Sign in
                            </Link>
                            <Link
                                href="/auth/signin"
                                className="text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-all hover:shadow-lg hover:shadow-violet-500/25 active:scale-95"
                            >
                                Get Started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
