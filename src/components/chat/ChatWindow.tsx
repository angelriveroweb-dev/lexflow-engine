import React, { useEffect, useRef } from "react";
import { Bot, User, Volume2, ExternalLink, CreditCard, CheckCircle } from "lucide-react";
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

const TypingIndicator: React.FC<{ gradient: string, accentColor: string }> = ({ gradient, accentColor }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex gap-3"
        role="status"
        aria-label="El asistente está escribiendo..."
    >
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center shrink-0 shadow-lg`}>
            <Bot size={16} className="text-white" aria-hidden />
        </div>
        <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
            <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ backgroundColor: accentColor }}></span>
            <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ backgroundColor: accentColor + '99' }}></span>
            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: accentColor + '4D' }}></span>
        </div>
    </motion.div>
);

const PaymentCard: React.FC<{
    paymentLink: string;
    paymentAmount?: string;
    primaryColor: string;
}> = ({ paymentLink, paymentAmount, primaryColor }) => {
    const formattedAmount = paymentAmount ? (
        paymentAmount.includes('$') ? paymentAmount : `$${Number(paymentAmount).toLocaleString('es-MX')} MXN`
    ) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mt-3 bg-zinc-900/80 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl w-full max-w-sm"
        >
            <div className="p-1" style={{ background: `linear-gradient(135deg, ${primaryColor}33, transparent)` }}>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                            style={{ backgroundColor: primaryColor + '22', border: `1px solid ${primaryColor}44` }}
                        >
                            <CreditCard size={22} style={{ color: primaryColor }} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Honorarios de consulta</p>
                            {formattedAmount && (
                                <p className="text-2xl font-black text-white leading-tight">{formattedAmount}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2 text-[11px] text-zinc-400 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            <span>Pago seguro vía MercadoPago</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                            <span>Confirmación inmediata por WhatsApp</span>
                        </div>
                    </div>

                    <a
                        href={paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl text-sm font-black text-white transition-all hover:brightness-110 hover:scale-[1.02] active:scale-95 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.3)]"
                        style={{ backgroundColor: primaryColor }}
                    >
                        💳 Ir al link de pago
                        <ExternalLink size={16} />
                    </a>

                    <p className="text-[10px] text-center text-zinc-500 font-bold uppercase tracking-tighter">
                        Protegido por encriptación de 256 bits
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({
    messages,
    isLoading,
    isAnalyzing,
    onSend,
    onAbort,
    sessionId,
    config
}) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { speak, isSpeaking, stopSpeaking } = useSpeech();
    const { ui, businessHours } = config;
    const firstPaymentCardId = messages.find(m => m.sender === "bot" && m.showPaymentCard && m.paymentLink)?.id;

    const lastScheduleMessageId = [...messages].reverse().find(m => m.sender === "bot" && m.action === "schedule_appointment")?.id;

    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    const formatTime = (date: Date) =>
        new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(date);

    return (
        <div
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar min-h-0 scrollbar-hide"
            role="log"
            aria-label="Conversación"
            aria-live="polite"
        >
            <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
                        role={msg.sender === "bot" ? "article" : "none"}
                    >
                        <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ${msg.sender === "bot"
                                ? "bg-gradient-to-tr " + ui.gradient
                                : "bg-zinc-800"
                                }`}
                            aria-hidden
                        >
                            {msg.sender === "bot"
                                ? (ui.avatarUrl
                                    ? <img src={ui.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    : <Bot size={16} className="text-white" />)
                                : <User size={16} className="text-zinc-300" />}
                        </div>

                        <div className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                            <div
                                className={`rounded-2xl text-sm leading-relaxed relative group shadow-sm overflow-hidden ${msg.sender === "user"
                                    ? "bg-zinc-800 text-zinc-100 border border-white/5 rounded-tr-sm p-4"
                                    : "bg-gradient-to-tr from-zinc-900/90 to-zinc-950/90 text-white border border-white/10 rounded-tl-sm " + (msg.text ? "p-4" : "p-0")
                                    }`}
                            >
                                {msg.text && (
                                    <div className="text-[13px] md:text-sm text-current leading-relaxed mt-1">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm, remarkBreaks]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                                strong: ({ node, ...props }) => <strong className="font-bold" style={{ color: config.ui.accentColor }} {...props} />,
                                                em: ({ node, ...props }) => <em className="italic text-zinc-300" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="marker:text-zinc-400" style={{ markerColor: config.ui.accentColor } as any} {...props} />,
                                                h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
                                                h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mb-2 mt-4" {...props} />,
                                                h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mb-2 mt-3" {...props} />,
                                                a: ({ node, ...props }) => (
                                                    <a
                                                        className="underline hover:text-white transition-colors break-words"
                                                        style={{ color: config.ui.accentColor }}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        {...props}
                                                    />
                                                ),
                                                img: ({ node, ...props }) => (
                                                    <img
                                                        className="rounded-lg border border-white/10 my-3 max-w-full h-auto shadow-md"
                                                        loading="lazy"
                                                        {...props}
                                                    />
                                                ),
                                                code: ({ node, inline, className, children, ...props }: any) => {
                                                    const match = /language-(\w+)/.exec(className || '');
                                                    const isJson = match && match[1] === 'json';
                                                    if (!inline && isJson) {
                                                        return (
                                                            <details className="bg-zinc-900/50 border border-white/10 rounded-lg my-3 overflow-hidden group">
                                                                <summary className="text-[10px] uppercase font-bold text-zinc-500 p-2.5 cursor-pointer hover:bg-white/5 transition-colors select-none flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-open:bg-emerald-500 transition-colors"></div>
                                                                    Ver Metadatos / JSON
                                                                </summary>
                                                                <pre className="p-3 overflow-x-auto text-[11px] font-mono text-zinc-400 border-t border-white/5 bg-zinc-950/50">
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                </pre>
                                                            </details>
                                                        );
                                                    }
                                                    return inline
                                                        ? <code className="bg-zinc-900 border border-white/10 px-1 py-0.5 rounded text-emerald-400 font-mono text-[11px]" {...props}>{children}</code>
                                                        : <pre className="bg-zinc-900 border border-white/10 p-3 rounded-lg overflow-x-auto text-[11px] font-mono text-zinc-300 my-3"><code className={className} {...props}>{children}</code></pre>
                                                }
                                            }}
                                        >
                                            {msg.text.replace(/\\\*/g, '*').replace(/\\_/g, '_')}
                                        </ReactMarkdown>
                                    </div>
                                )}

                                {msg.image && (
                                    <div className={`${msg.text ? "mt-2" : ""} rounded-lg overflow-hidden flex justify-center bg-zinc-900/50`}>
                                        <img
                                            src={msg.image}
                                            alt="Imagen adjunta"
                                            className="max-w-full h-auto max-h-[400px] object-contain block"
                                            loading="lazy"
                                        />
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
                                        className={`absolute -right-10 top-2 p-1.5 rounded-full bg-zinc-900 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-800 ${isSpeaking ? "opacity-100" : ""}`}
                                        style={{ color: isSpeaking ? config.ui.accentColor : undefined }}
                                        aria-label={isSpeaking ? "Detener lectura" : "Escuchar mensaje"}
                                        title={isSpeaking ? "Detener" : "Escuchar"}
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Calendar Booking widget */}
                            {msg.sender === "bot" && msg.action === "schedule_appointment" && msg.id === lastScheduleMessageId && (
                                <CalendarBooking
                                    sessionId={sessionId}
                                    webhookUrl={config.webhookUrl}
                                    primaryColor={ui.primaryColor}
                                    accentColor={ui.accentColor}
                                    businessHours={businessHours}
                                    onSelect={(datetime) => onSend?.(datetime)}
                                />
                            )}

                            {/* Payment Card — shown when showPaymentCard is true */}
                            {msg.sender === "bot" && msg.showPaymentCard && msg.paymentLink && msg.id === firstPaymentCardId && (
                                <div id={`payment-card-${msg.id}`}>
                                    <PaymentCard
                                        paymentLink={msg.paymentLink}
                                        paymentAmount={msg.paymentAmount || String(msg.consultationPrice)}
                                        primaryColor={ui.primaryColor}
                                    />
                                </div>
                            )}

                            {/* Subsequent Payment Card — show inline text with scroll-to-payment button */}
                            {msg.sender === "bot" && msg.showPaymentCard && msg.paymentLink && msg.id !== firstPaymentCardId && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center justify-between gap-4 w-full max-w-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                            <CreditCard size={14} className="text-zinc-400" />
                                        </div>
                                        <p className="text-xs text-zinc-400 font-medium">Ya te compartimos el link de pago arriba 👆</p>
                                    </div>
                                    <button
                                        onClick={() => document.getElementById(`payment-card-${firstPaymentCardId}`)?.scrollIntoView({ behavior: 'smooth' })}
                                        className="text-[10px] font-black uppercase tracking-widest text-white px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-95 border border-white/5"
                                    >
                                        Ver link
                                    </button>
                                </motion.div>
                            )}

                            {/* Payment confirmed badge - Now requires both isPaid AND lawyerConfirmed */}
                            {msg.sender === "bot" && msg.isPaid && msg.lawyerConfirmed && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-2 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1.5"
                                >
                                    <CheckCircle size={12} className="text-emerald-500" />
                                    <span className="text-[11px] text-emerald-400 font-semibold">Pago confirmado — Podés agendar tu cita</span>
                                </motion.div>
                            )}

                            {/* Suggestion buttons */}
                            {msg.sender === "bot" && msg.options && msg.options.length > 0 &&
                                msg.action !== "schedule_appointment" && msg.action !== "schedule_processing" && (
                                    <div className="mt-3 flex flex-wrap gap-2 justify-start items-center" role="group" aria-label="Opciones rápidas">
                                        {msg.options.map((option, idx) => (
                                            <motion.button
                                                key={`${option}-${idx}`}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                whileHover={{ scale: 1.05 }}
                                                onClick={() => onSend?.(option)}
                                                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-200 text-sm font-medium transition-all shadow-lg flex items-center gap-2 hover:border-white/20 hover:bg-white/10"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.ui.accentColor }} aria-hidden></div>
                                                {option}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                            <div className="mt-1 px-1 flex items-center gap-2">
                                <span className="text-[10px] text-zinc-500" aria-label={`Enviado a las ${formatTime(msg.timestamp)}`}>
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {/* Typing indicator while loading */}
            <AnimatePresence>
                {isLoading && !isAnalyzing && (
                    <TypingIndicator gradient={ui.gradient} accentColor={ui.accentColor} />
                )}
            </AnimatePresence>

            {/* Analyzing overlay */}
            {isAnalyzing && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute bottom-6 left-4 right-4 z-30"
                    role="status"
                    aria-live="polite"
                    aria-label="Analizando documento..."
                >
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl overflow-hidden relative">
                        <motion.div
                            animate={{ y: ["-10%", "150%", "-10%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-x-0 h-12 z-0"
                            style={{ filter: "blur(8px)", background: `linear-gradient(to bottom, transparent, ${config.ui.accentColor}1A, transparent)` }}
                            aria-hidden
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="relative w-16 h-16 mb-4" aria-hidden>
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 rounded-full border-2 border-white/5"
                                    style={{ borderTopColor: config.ui.accentColor }}
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-1 rounded-full border-2 border-white/5"
                                    style={{ borderLeftColor: config.ui.accentColor + 'B3' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Bot size={22} style={{ color: config.ui.accentColor }} />
                                    <motion.div
                                        animate={{ opacity: [0, 1, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full"
                                        style={{ backgroundColor: config.ui.accentColor + '33' }}
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
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" aria-hidden></span>
                                Interrumpir Análisis
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            <div ref={bottomRef} aria-hidden />
        </div>
    );
};
