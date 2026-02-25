import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserByEmail } from "@/db/queries";
import { getUserScans } from "@/db/queries";
import ScanCard from "@/components/dashboard/ScanCard";
import Link from "next/link";
import type { GapItem } from "@/db/schema";

export const metadata = {
    title: "Dashboard — AI Gap Radar | AuraIQ",
};

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/auth/signin");
    }

    const user = await getUserByEmail(session.user.email);

    if (!user) {
        redirect("/auth/signin");
    }

    const scans = await getUserScans(user.id);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative w-7 h-7 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-blue-600 rounded-full radar-dot" />
                            <div className="absolute w-6 h-6 border-2 border-blue-300 rounded-full opacity-50" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">AI Gap Radar</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {session.user.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={session.user.image}
                                alt={session.user.name ?? "User"}
                                className="w-7 h-7 rounded-full"
                            />
                        )}
                        <span className="text-sm text-gray-700">{session.user.name}</span>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Your Gap Scans</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {scans.length === 0
                                ? "No scans yet. Run your first scan with the Chrome Extension."
                                : `${scans.length} scan${scans.length === 1 ? "" : "s"} completed`}
                        </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                        <p className="text-xs text-blue-700 font-medium">
                            📡 Use the Chrome Extension to run scans
                        </p>
                    </div>
                </div>

                {/* Empty state */}
                {scans.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📡</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            No scans yet
                        </h3>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                            Install the AI Gap Radar Chrome Extension, enter competitor channels and a keyword, then hit Scan.
                        </p>
                        <Link
                            href="#"
                            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-blue-700 transition-colors"
                        >
                            Get Chrome Extension
                        </Link>
                    </div>
                ) : (
                    /* Scan list */
                    <div className="space-y-12">
                        {scans.map((scan) => {
                            const result = scan.result as { gaps: GapItem[] } | null;
                            if (!result?.gaps?.length) return null;

                            return (
                                <div key={scan.id}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-base font-semibold text-gray-900">
                                            Keyword: &ldquo;{scan.keyword}&rdquo;
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(scan.createdAt).toLocaleDateString("en-US", {
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-5">
                                        {result.gaps.map((gap, i) => (
                                            <ScanCard
                                                key={i}
                                                keyword={scan.keyword}
                                                gap={gap}
                                                rank={i + 1}
                                                createdAt={scan.createdAt}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
