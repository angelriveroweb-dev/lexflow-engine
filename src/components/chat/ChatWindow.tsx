import React, { useEffect, useRef } from "react";
import { Bot, User, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeech } from "../../hooks/useSpeech";
import { CalendarBooking } from "./CalendarBooking";
import type { Message } from "../../types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { LexFlowConfig } from "../../core/ConfigLoader";

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    isAnalyzing?: boolean;
    onSend?: (text: string, file?: File) => void;
    onAbort?: () => void;
    sessionId: string;
    config: LexFlowConfig;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, isAnalyzing, onSend, onAbort, sessionId, config }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { speak, isSpeaking, stopSpeaking } = useSpeech();
    const { ui } = config;

    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(date);
    };

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar min-h-0 scrollbar-hide">
            <AnimatePresence>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ${msg.sender === "bot" ? "bg-gradient-to-tr " + ui.gradient : "bg-zinc-800"}`}>
                            {msg.sender === "bot" ? (
                                ui.avatarUrl ? <img src={ui.avatarUrl} alt="B" className="w-full h-full object-cover" /> : <Bot size={16} className="text-white" />
                            ) : (
                                <User size={16} className="text-zinc-300" />
                            )}
                        </div>

                        <div className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                            <div className={`rounded-2xl text-sm leading-relaxed relative group shadow-sm overflow-hidden ${msg.sender === "user"
                                ? "bg-zinc-800 text-zinc-100 border border-white/5 rounded-tr-sm p-4"
                                : "bg-gradient-to-tr from-zinc-900/90 to-zinc-950/90 text-white border border-white/10 rounded-tl-sm " + (msg.text ? "p-4" : "p-0")
                                }`}>

                                {msg.text && (
                                    <div className="text-[13px] md:text-sm text-current leading-relaxed mt-1">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold text-[#C6A87C]" {...props} />,
                                                em: ({ node, ...props }) => <em className="italic text-zinc-300" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="marker:text-[#C6A87C]" {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mb-2 mt-4" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-2 mt-3" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-[#C6A87C] underline hover:text-white transition-colors break-words" target="_blank" rel="noopener noreferrer" {...props} />,
                                                img: ({ node, ...props }) => <img className="rounded-lg border border-white/10 my-3 max-w-full h-auto shadow-md" loading="lazy" {...props} />,
                                                code: ({ node, inline, ...props }: any) =>
                                                    inline ? <code className="bg-zinc-900 border border-white/10 px-1 py-0.5 rounded text-emerald-400 font-mono text-[11px]" {...props} />
                                                        : <pre className="bg-zinc-900 border border-white/10 p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-zinc-300 my-3"><code {...props} /></pre>
                                            }}
                                        >
                                            {/* Unescape markdown asterisks and underscores if LLM incorrectly escaped them */}
                                            {msg.text.replace(/\\\*/g, '*').replace(/\\_/g, '_')}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {msg.image && (
                                    <div className={`${msg.text ? "mt-2" : ""} rounded-lg overflow-hidden flex justify-center bg-zinc-900/50`}>
                                        <img src={msg.image} alt="Imagen" className="max-w-full h-auto max-h-[400px] object-contain block" />
                                    </div>
                                )}

                                {msg.file && (
                                    <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2 max-w-[200px]">
                                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-[10px] text-zinc-400 font-mono">
                                            {msg.file.name.split(".").pop()?.toUpperCase() || "FILE"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-300 truncate">{msg.file.name}</p>
                                        </div>
                                    </div>
                                )}

                                {msg.sender === "bot" && msg.text && (
                                    <button
                                        onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text!)}
                                        className={`absolute -right-10 top-2 p-1.5 rounded-full bg-zinc-900 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#C6A87C] hover:bg-zinc-800 ${isSpeaking ? "text-[#C6A87C] opacity-100" : ""}`}
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                )}
                            </div>

                            {msg.sender === "bot" && msg.action === "schedule_appointment" && (
                                <CalendarBooking
                                    sessionId={sessionId}
                                    webhookUrl={config.webhookUrl}
                                    primaryColor={ui.primaryColor}
                                    onSelect={(datetime) => onSend?.(datetime)}
                                />
                            )}

                            {msg.sender === "bot" && msg.options && msg.options.length > 0 && msg.action !== "schedule_appointment" && (
                                <div className="mt-3 flex flex-wrap gap-2 justify-start items-center">
                                    {msg.options.map((option, idx) => (
                                        <motion.button
                                            key={`${option}-${idx}`}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.05)", borderColor: "rgba(255, 255, 255, 0.2)" }}
                                            onClick={() => onSend?.(option)}
                                            className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-200 text-sm font-medium transition-all shadow-lg flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#C6A87C]"></div>
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <div className="mt-1 px-1 flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500">{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {isLoading && (
                <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${ui.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
                        <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-[#C6A87C] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-[#C6A87C]/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-[#C6A87C]/30 rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}

            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-6 left-4 right-4 z-30"
                >
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl premium-shadow overflow-hidden relative">
                        {/* Scanning beam effect */}
                        <motion.div
                            animate={{ y: ["-10%", "150%", "-10%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-[#C6A87C]/10 to-transparent z-0"
                            style={{ filter: "blur(8px)" }}
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative w-16 h-16 mb-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-2 border-white/5 border-t-[#C6A87C]"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-1 rounded-full border-2 border-white/5 border-l-[#C6A87C]/70"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Bot size={22} className="text-[#C6A87C]" />
                                    <motion.div
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full bg-[#C6A87C]/20"
                                    />
                                </div>
                            </div>

                            <h4 className="text-white font-medium text-base mb-1">Evaluando Documento</h4>
                            <p className="text-zinc-400 text-xs mb-4 max-w-[200px] leading-relaxed">
                                Escaneando contenido legal e identificando puntos críticos...
                            </p>

                            <button
                                onClick={onAbort}
                                className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-semibold hover:bg-red-500/20 hover:scale-105 transition-all shadow-sm flex items-center gap-2"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                Interrumpir Análisis
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};