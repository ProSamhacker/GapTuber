import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-400 py-12 px-4">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Brand */}
                <div className="flex flex-col items-center md:items-start gap-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full radar-dot" />
                        <span className="text-white font-bold text-sm">AI Gap Radar</span>
                    </div>
                    <span className="text-xs text-gray-500">by AuraIQ</span>
                    <p className="text-xs text-gray-500 mt-1">
                        Strategic Intelligence for Creators
                    </p>
                </div>

                {/* Links */}
                <div className="flex items-center gap-6">
                    <Link href="/privacy" className="text-sm hover:text-blue-400 transition-colors">
                        Privacy
                    </Link>
                    <Link href="/terms" className="text-sm hover:text-blue-400 transition-colors">
                        Terms
                    </Link>
                    <Link href="mailto:hello@nocreditai.com" className="text-sm hover:text-blue-400 transition-colors">
                        Contact
                    </Link>
                </div>

                {/* Copyright */}
                <div className="text-xs text-gray-600">
                    © {new Date().getFullYear()} AuraIQ. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
