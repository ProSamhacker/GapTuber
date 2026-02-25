"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="relative flex items-center justify-center w-8 h-8">
                        <div className="w-3 h-3 bg-blue-600 rounded-full radar-dot" />
                        <div className="absolute w-7 h-7 border-2 border-blue-400 rounded-full opacity-50 group-hover:opacity-80 transition-opacity" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                            AuraIQ
                        </span>
                        <span className="text-sm font-bold text-gray-900">AI Gap Radar</span>
                    </div>
                </Link>

                {/* Nav links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link
                        href="#how-it-works"
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        How It Works
                    </Link>
                    <Link
                        href="#sample-output"
                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        Sample Output
                    </Link>
                    {session ? (
                        <Link
                            href="/dashboard"
                            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            Dashboard
                        </Link>
                    ) : null}
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
                                        className="w-7 h-7 rounded-full"
                                    />
                                )}
                                <span className="text-sm text-gray-700 hidden sm:block">
                                    {session.user?.name?.split(" ")[0]}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link
                                href="/auth/signin"
                                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/auth/signin"
                                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Start Free Scan
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
