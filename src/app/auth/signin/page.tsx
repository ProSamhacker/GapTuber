"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

function SignInContent() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-white flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2">
                            <div className="relative w-10 h-10 flex items-center justify-center">
                                <div className="w-4 h-4 bg-blue-600 rounded-full radar-dot" />
                                <div className="absolute w-9 h-9 border-2 border-blue-300 rounded-full opacity-50" />
                            </div>
                            <span className="text-2xl font-extrabold text-gray-900">AI Gap Radar</span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium tracking-wider">by AuraIQ</span>
                    </Link>
                </div>

                {/* Card */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                        Welcome back
                    </h1>
                    <p className="text-gray-500 text-sm text-center mb-8">
                        Sign in to run your gap scans and access your dashboard.
                    </p>

                    {/* Google OAuth */}
                    <button
                        onClick={() => signIn("google", { callbackUrl })}
                        className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-5 py-3.5 text-gray-700 font-medium hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        By continuing, you agree to our{" "}
                        <Link href="/terms" className="text-blue-600 hover:underline">
                            Terms
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </Link>
                        .
                    </p>
                </div>

                <p className="text-center text-sm text-gray-400 mt-6">
                    No credit card required.
                </p>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-blue-50 flex items-center justify-center" />}>
            <SignInContent />
        </Suspense>
    );
}
