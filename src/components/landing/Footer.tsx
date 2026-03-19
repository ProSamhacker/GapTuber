import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-[#060608] text-gray-500 py-14 px-4 border-t border-white/5">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-10 mb-10">
                    {/* Brand */}
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <div className="flex items-center gap-2.5">
                            <img src="/auraiq-logo.png" alt="AuraIQ Logo" className="w-9 h-9 object-contain" />
                            <span className="text-white font-bold text-lg">AuraIQ</span>
                        </div>
                        <p className="text-xs text-gray-600 max-w-xs text-center md:text-left">
                            Statistical gap detection for YouTube creators who want to grow smarter, not just harder.
                        </p>
                        <p className="text-xs text-gray-700 mt-1">
                            Part of <a href="https://aurionstack.dev" target="_blank" rel="noopener noreferrer" className="text-violet-700 hover:text-violet-500 transition-colors">AurionStack</a>
                        </p>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-x-16 gap-y-2 text-sm">
                        <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="#why-auraiq" className="hover:text-white transition-colors">Why AuraIQ</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="mailto:hello@aurionstack.dev" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>

                <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-700">
                        © {new Date().getFullYear()} AuraIQ by AurionStack. All rights reserved.
                    </p>
                    <p className="text-xs text-gray-700">
                        Built by a creator, for creators ⚡
                    </p>
                </div>
            </div>
        </footer>
    );
}
