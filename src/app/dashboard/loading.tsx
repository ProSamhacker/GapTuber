export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 h-16" />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-32 mb-8" />
                    <div className="grid md:grid-cols-3 gap-5">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                                <div className="h-12 bg-gray-100" />
                                <div className="p-5 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded w-full" />
                                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                                    <div className="h-16 bg-gray-50 rounded-xl" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="h-12 bg-gray-100 rounded-xl" />
                                        <div className="h-12 bg-gray-100 rounded-xl" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
