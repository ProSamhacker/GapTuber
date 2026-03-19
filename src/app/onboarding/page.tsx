"use client";

import { motion } from "framer-motion";
import { Video, Youtube } from "lucide-react";
import Link from "next/link";

export default function OnboardingRoleSelection() {
    return (
        <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <div className="space-y-4">
                <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900"
                >
                    Welcome to <span className="text-blue-600">AuraIQ</span>
                </motion.h1>
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl text-slate-600 max-w-2xl mx-auto"
                >
                    Let's tailor your experience. Where are you in your YouTube journey?
                </motion.p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 w-full pt-8">
                <Link href="/onboarding/new-tuber" className="block w-full">
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer h-full"
                    >
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6">
                            <Video className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Starting Fresh</h3>
                        <p className="text-slate-600 leading-relaxed">
                            I want to create a brand new channel. Help me find a niche, topic, and generate my branding.
                        </p>
                    </motion.div>
                </Link>

                <Link href="/onboarding/existing-tuber" className="block w-full">
                    <motion.div 
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="group relative flex flex-col items-center p-8 bg-white border-2 border-slate-200 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer h-full"
                    >
                        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors rounded-2xl flex items-center justify-center mb-6">
                            <Youtube className="w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-3">Existing Creator</h3>
                        <p className="text-slate-600 leading-relaxed">
                            I already have a channel. Analyze my content and give me data-driven viral ideas.
                        </p>
                    </motion.div>
                </Link>
            </div>
        </div>
    );
}
