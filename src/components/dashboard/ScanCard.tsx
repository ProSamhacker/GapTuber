import type { GapItem } from "@/db/schema";

interface ScanCardProps {
    keyword: string;
    gap: GapItem;
    rank: number;
    createdAt: Date;
}

function getScoreColor(score: number): string {
    if (score >= 8) return "text-blue-600 bg-blue-50 border-blue-200";
    if (score >= 6) return "text-blue-500 bg-blue-50 border-blue-100";
    if (score >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-500 bg-gray-50 border-gray-200";
}

function getScoreDotColor(score: number): string {
    if (score >= 8) return "bg-blue-600";
    if (score >= 6) return "bg-blue-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-gray-400";
}

export default function ScanCard({ keyword, gap, rank, createdAt }: ScanCardProps) {
    const scoreColorClass = getScoreColor(gap.gapScore);
    const dotColorClass = getScoreDotColor(gap.gapScore);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-blue-300 hover:shadow-md transition-all overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Gap #{rank}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {keyword}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1 ${scoreColorClass}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`} />
                        <span className="text-xs font-bold">{gap.gapScore}/10</span>
                    </div>
                </div>
            </div>

            <div className="p-5">
                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-base mb-3 leading-snug">
                    {gap.title}
                </h3>

                {/* Reasoning */}
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{gap.reasoning}</p>

                {/* Hook */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
                    <div className="text-xs font-semibold text-blue-700 mb-1">🎣 Hook</div>
                    <p className="text-sm text-gray-700 italic">&ldquo;{gap.hook}&rdquo;</p>
                </div>

                {/* Format + Monetization */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="text-xs font-semibold text-gray-400 mb-1">📹 Format</div>
                        <p className="text-xs text-gray-700">{gap.format}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <div className="text-xs font-semibold text-gray-400 mb-1">💰 Monetization</div>
                        <p className="text-xs text-gray-700">{gap.monetizationAngle}</p>
                    </div>
                </div>

                {/* Timestamp */}
                <div className="mt-4 text-xs text-gray-300 text-right">
                    {new Date(createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                </div>
            </div>
        </div>
    );
}
