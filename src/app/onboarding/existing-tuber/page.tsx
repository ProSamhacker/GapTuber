"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { completeExistingTuberOnboarding } from "../actions";
import { Search, Youtube, BarChart3, Target, Zap, CheckCircle2 } from "lucide-react";

export default function ExistingTuberPage() {
    const [step, setStep] = useState(1);
    const [channelUrl, setChannelUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisProgress, setAnalysisProgress] = useState(0);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        // Simulate channel scan
        for (let i = 0; i <= 100; i += 20) {
            setAnalysisProgress(i);
            await new Promise(resolve => setTimeout(resolve, 600));
        }
        setIsAnalyzing(false);
        setStep(2);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
                {step === 1 && !isAnalyzing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white p-8 md:p-12 border border-slate-200 rounded-3xl shadow-sm"
                    >
                        <div className="text-center mb-10">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Youtube className="w-8 h-8" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Connect Your Channel</h2>
                            <p className="text-slate-600">
                                Paste your YouTube channel URL or handle below. We'll instantly audit your recent content to find your biggest untapped growth gaps.
                            </p>
                        </div>
                        
                        <div className="space-y-6 max-w-xl mx-auto">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="https://youtube.com/@YourHandle" 
                                    className="w-full pl-12 p-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-lg"
                                    value={channelUrl}
                                    onChange={(e) => setChannelUrl(e.target.value)}
                                />
                            </div>
                            <p className="text-sm text-slate-500 text-center">
                                Safe & Secure. We only scan public metadata (no intrusive permissions required).
                            </p>

                            <button 
                                type="button"
                                disabled={!channelUrl}
                                onClick={handleAnalyze}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                            >
                                <BarChart3 className="w-5 h-5" />
                                Start Channel Audit Let's Go
                            </button>
                            
                            <div className="text-center pt-4">
                                <button 
                                    type="button"
                                    onClick={() => window.history.back()}
                                    className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
                                >
                                    &larr; Go back
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isAnalyzing && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-white p-12 border border-slate-200 rounded-3xl shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]"
                    >
                        {/* Radar animation */}
                        <div className="relative mb-8 w-32 h-32 flex items-center justify-center">
                            <div className="absolute inset-0 bg-indigo-50 rounded-full"></div>
                            <div className="absolute inset-2 border-2 border-indigo-100 rounded-full"></div>
                            <div className="absolute inset-6 border-2 border-indigo-200 rounded-full"></div>
                            <div className="absolute inset-0 border-t-2 border-indigo-600 rounded-full animate-spin [animation-duration:2s]"></div>
                            <Search className="relative z-10 w-8 h-8 text-indigo-600" />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Auditing Your Channel...</h3>
                        <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
                            <motion.div 
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 h-2.5 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${analysisProgress}%` }}
                                transition={{ duration: 0.6 }}
                            />
                        </div>
                        
                        <div className="space-y-3 text-slate-500 font-medium">
                            <p className={analysisProgress >= 20 ? "text-indigo-600 flex items-center justify-center gap-2" : "opacity-50"}>
                                {analysisProgress >= 20 && <CheckCircle2 className="w-4 h-4" />}
                                Fetching last 50 videos...
                            </p>
                            <p className={analysisProgress >= 40 ? "text-indigo-600 flex items-center justify-center gap-2" : "opacity-50"}>
                                {analysisProgress >= 40 && <CheckCircle2 className="w-4 h-4" />}
                                Calculating Engagement Velocity...
                            </p>
                            <p className={analysisProgress >= 60 ? "text-indigo-600 flex items-center justify-center gap-2" : "opacity-50"}>
                                {analysisProgress >= 60 && <CheckCircle2 className="w-4 h-4" />}
                                Cross-referencing competitor benchmarks...
                            </p>
                            <p className={analysisProgress >= 80 ? "text-indigo-600 flex items-center justify-center gap-2" : "opacity-50"}>
                                {analysisProgress >= 80 && <CheckCircle2 className="w-4 h-4" />}
                                Identifying 3 high-ROI video topics...
                            </p>
                        </div>
                    </motion.div>
                )}

                {step === 2 && !isAnalyzing && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-white p-8 md:p-12 border border-slate-200 rounded-3xl shadow-sm text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Audit Complete!</h2>
                            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
                                We've analyzed your content and found <span className="font-bold text-indigo-600">3 high-potential content gaps</span> you can exploit right now to 2x your viewership.
                            </p>

                            <div className="grid sm:grid-cols-3 gap-6 mb-10 text-left">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                                        <Target className="w-5 h-5 text-blue-500" />
                                        Primary Niche
                                    </h4>
                                    <p className="text-slate-600 text-sm">Identified as: Tech & Software Tutorials (High Demand)</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                                        <Zap className="w-5 h-5 text-yellow-500" />
                                        Biggest Opportunity
                                    </h4>
                                    <p className="text-slate-600 text-sm">"How-to" guides for beginners (Low competition in your style)</p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                                        Growth Potential
                                    </h4>
                                    <p className="text-slate-600 text-sm">Strong. Ready to generate your first batch of viral scripts.</p>
                                </div>
                            </div>
                            
                            {/* Submit to DB */}
                            <form action={completeExistingTuberOnboarding}>
                                <input type="hidden" name="channelUrl" value={channelUrl} />
                                <button 
                                    type="submit"
                                    className="w-full max-w-md mx-auto py-5 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
                                >
                                    Proceed to Dashboard &rarr;
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
