import { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="w-full p-6 flex justify-center items-center">
                <Link href="/" className="flex items-center gap-2">
                    <div className="flex bg-blue-600 text-white p-1 rounded-lg">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                        AuraIQ
                    </span>
                </Link>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-4xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
