"use client";

import { ChatProvider, useChat } from "@/app/bot/context";
import { EnhancedChatInput } from "@/app/bot/components/EnhancedChatInput";
import { EnhancedChatBubble } from "@/app/bot/components/EnhancedChatBubble";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bot, Sparkles, Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, ArrowDown } from "lucide-react";
import type { BotMessage, BotChat } from "@/db/schema";

// ── Chat History Sidebar ─────────────────────────────────────────────────────
function ChatHistorySidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    const { chats, activeChatId, setActiveChatId, createNewChat, deleteChat, isLoadingChats } = useChat();

    return (
        <div className={`relative flex flex-col border-r border-white/[0.06] bg-black/20 transition-all duration-300 ${collapsed ? "w-0 overflow-hidden" : "w-64 shrink-0"}`}>
            <div className="p-4 border-b border-white/[0.06]">
                <button
                    onClick={() => createNewChat()}
                    className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-violet-500/20"
                >
                    <Plus className="w-4 h-4" /> New Chat
                </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
                {isLoadingChats ? (
                    <div className="flex flex-col gap-2 p-3">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-9 rounded-lg bg-white/5 animate-pulse" />)}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="text-center px-4 py-8">
                        <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-500">No chats yet.</p>
                    </div>
                ) : (
                    <div className="px-2 space-y-0.5">
                        {chats.map((chat: BotChat) => (
                            <div
                                key={chat.id}
                                onClick={() => setActiveChatId(chat.id)}
                                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeChatId === chat.id ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
                            >
                                <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
                                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeChatId === chat.id ? "text-violet-400" : "text-slate-500"}`} />
                                    <span className="text-xs truncate">{chat.title}</span>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 ml-1"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-[#1a1b22] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:border-violet-500/50 transition-all shadow-lg"
            >
                <ChevronLeft className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ── Welcome Screen ───────────────────────────────────────────────────────────
function WelcomeScreen() {
    const { sendMessage } = useChat();
    const suggestions = [
        { icon: "✍️", text: "Write a YouTube script for my next video" },
        { icon: "🎣", text: "Generate 5 viral video hooks for my niche" },
        { icon: "🔍", text: "Optimize my video title for YouTube SEO" },
        { icon: "📊", text: "Analyze this PDF and summarize key points" },
        { icon: "📅", text: "Create a 30-day content calendar" },
        { icon: "💻", text: "Write a Python script to download YouTube data" },
    ];

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-2xl mx-auto w-full">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-600/30 to-indigo-600/30 rounded-2xl flex items-center justify-center mb-5 border border-violet-500/20">
                <Bot className="w-8 h-8 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">AuraIQ AI Studio</h2>
            <p className="text-slate-400 text-sm text-center mb-8 max-w-sm">Channel-aware scriptwriter and growth strategist. Upload PDFs, images, DOCX, PPTX, and more.</p>
            <div className="grid grid-cols-2 gap-2.5 w-full">
                {suggestions.map((s, i) => (
                    <button key={i} onClick={() => sendMessage(s.text)} className="flex items-center gap-3 p-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl text-left hover:bg-white/[0.06] hover:border-violet-500/30 hover:text-white transition-all">
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-xs text-slate-300 leading-snug">{s.text}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── Chat Messages Area ───────────────────────────────────────────────────────
function ChatArea() {
    const { messages, activeChatId, isGenerating, sendMessage } = useChat();
    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        const atBottom = distanceToBottom < 100;
        setIsAtBottom(atBottom);
        setShowScrollButton(!atBottom);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll when messages update, but only if user is at the bottom
    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        }
    }, [messages, isAtBottom]);

    // Force scroll when switching chats
    useEffect(() => {
        setTimeout(scrollToBottom, 50);
    }, [activeChatId]);

    if (!activeChatId && messages.length === 0) return <WelcomeScreen />;

    return (
        <div className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
                .chat-scroll-area::-webkit-scrollbar {
                    width: 5px;
                }
                .chat-scroll-area::-webkit-scrollbar-track {
                    background: transparent;
                }
                .chat-scroll-area::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.1);
                    border-radius: 20px;
                }
                .chat-scroll-area:hover::-webkit-scrollbar-thumb {
                    background: rgba(139, 92, 246, 0.3);
                }
                .chat-scroll-area {
                    scrollbar-gutter: stable;
                }
            `}</style>

            <div 
                ref={scrollRef} 
                onScroll={handleScroll} 
                className="flex-1 overflow-y-auto chat-scroll-area scroll-smooth pt-4 pb-20 px-4 md:px-8"
            >
                <div className="max-w-4xl mx-auto w-full">
                    {messages.map((msg: BotMessage, index: number) => {
                        const isLastAI = index === messages.length - 1 && msg.sender === "ai" && !isGenerating;
                        const isScript = msg.content.includes("| Scene / Section |");
                        
                        return (
                            <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <EnhancedChatBubble message={msg} />
                                {isLastAI && isScript && (
                                    <div className="flex flex-wrap gap-2 px-14 py-3 mt-1 mb-4">
                                        <div className="w-full text-xs font-semibold text-slate-500 mb-1">Quick Actions:</div>
                                        {[
                                            "Make the video longer (detailed)",
                                            "Make the video shorter (concise)",
                                            "Make the hook more aggressive",
                                            "Condense the timestamps",
                                            "Change the tone to be more humorous",
                                        ].map(suggestion => (
                                            <button
                                                key={suggestion}
                                                onClick={() => sendMessage(suggestion)}
                                                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/10 text-xs text-slate-300 hover:text-white transition-all shadow-sm"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    {isGenerating && messages.length > 0 && messages[messages.length - 1]?.content === "" && (
                        <div className="flex items-center gap-3 px-5 py-4">
                            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-4 h-4 text-violet-400" />
                            </div>
                            <div className="flex gap-1">
                                {[0, 150, 300].map(delay => (
                                    <div key={delay} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                                ))}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                </div>
            </div>

            {/* Jump to bottom button */}
            {showScrollButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-violet-600/90 hover:bg-violet-500 text-white backdrop-blur-md border border-violet-400/30 px-4 py-2 rounded-full text-xs font-semibold shadow-2xl shadow-violet-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2 group"
                >
                    <ArrowDown className="w-3.5 h-3.5 group-hover:animate-bounce" />
                    <span>Jump to New Messages</span>
                </button>
            )}
        </div>
    );
}

// ── Bot Page Header ──────────────────────────────────────────────────────────
function BotHeader({ title, collapsed, setCollapsed }: { title?: string; collapsed: boolean; setCollapsed: (v: boolean) => void }) {
    return (
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.06] bg-black/10 shrink-0">
            {collapsed && (
                <button onClick={() => setCollapsed(false)} className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </button>
            )}
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-violet-600/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-white leading-none line-clamp-1">{title || "AuraBot AI Studio"}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Groq · Gemini Vision · File Analysis</p>
                </div>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[10px] text-slate-500 font-medium">Online</span>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
function BotPageInner() {
    const searchParams = useSearchParams();
    const { createChatAndSend, sendMessage, chats, activeChatId, isLoadingChats } = useChat();
    const hasSentRef = useRef(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    useEffect(() => {
        if (hasSentRef.current || isLoadingChats) return;
        const title = searchParams?.get("title");
        const prompt = searchParams?.get("prompt");
        if (title && prompt) { hasSentRef.current = true; createChatAndSend(title, prompt); }
        else if (prompt) { hasSentRef.current = true; sendMessage(prompt); }
    }, [searchParams, createChatAndSend, sendMessage, isLoadingChats]);

    const activeChat = chats.find(c => c.id === activeChatId);

    return (
        <div className="flex h-screen md:h-[calc(100vh-0px)] bg-[#0c0d0f] overflow-hidden">
            <ChatHistorySidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <BotHeader title={activeChat?.title} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
                <ChatArea />
                <EnhancedChatInput />
            </div>
        </div>
    );
}

export default function BotPage() {
    return (
        <ChatProvider>
            <div className="h-full flex flex-col overflow-hidden">
                <BotPageInner />
            </div>
        </ChatProvider>
    );
}
