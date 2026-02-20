import React, { useEffect, useRef } from 'react';
import { Message } from '../../../hooks/useChat';
import { Bot, User, Volume2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeech } from '../../../hooks/useSpeech';
import { config } from '../../../config';
import { CalendarBooking } from './CalendarBooking';

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    onSend?: (text: string, file?: File) => void;
    sessionId: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, onSend, sessionId }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { speak, isSpeaking, stopSpeaking } = useSpeech();
    const { ui } = config.chatbot;

    // Auto-scroll to bottom
    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    // Format time helper
    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(date);
    };

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar min-h-0">
            <AnimatePresence>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ${msg.sender === 'bot' ? `bg-gradient-to-tr ${ui.gradient}` : 'bg-zinc-800'
                            }`}>
                            {msg.sender === 'bot' ? (
                                ui.avatarUrl ? <img src={ui.avatarUrl} alt="B" className="w-full h-full object-cover" /> : <Bot size={16} className="text-white" />
                            ) : (
                                <User size={16} className="text-zinc-300" />
                            )}
                        </div>

                        {/* Message Bubble */}
                        <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl text-sm leading-relaxed relative group shadow-sm overflow-hidden ${msg.sender === 'user'
                                ? 'bg-zinc-800 text-zinc-100 border border-white/5 rounded-tr-sm p-4'
                                : `bg-gradient-to-tr from-zinc-900 to-zinc-950 text-white border border-white/10 rounded-tl-sm ${msg.text ? 'p-4' : 'p-0'}`
                                }`}>

                                {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                                {msg.image && (
                                    <div className={`${msg.text ? 'mt-2' : ''} rounded-lg overflow-hidden flex justify-center bg-zinc-900/50`}>
                                        <img
                                            src={msg.image}
                                            alt="Imagen del Bot"
                                            className="max-w-full h-auto max-h-[400px] object-contain block"
                                            onError={(e) => {
                                                console.error("Error loading image:", msg.image);
                                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x200?text=Error+al+cargar+imagen";
                                            }}
                                        />
                                    </div>
                                )}

                                {msg.video && (
                                    <div className={`${msg.text ? 'mt-2' : ''} aspect-video bg-black`}>
                                        <iframe
                                            src={msg.video}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        ></iframe>
                                    </div>
                                )}

                                {/* User Uploaded File */}
                                {msg.file && (
                                    <div className="mt-2 p-2 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2 max-w-[200px]">
                                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-zinc-400 font-mono">
                                            {msg.file.name.split('.').pop()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-zinc-300 truncate">{msg.file.name}</p>
                                            <p className="text-[10px] text-zinc-500">Documento adjunto</p>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Output Button */}
                                {msg.sender === 'bot' && msg.text && (
                                    <button
                                        onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text!)}
                                        className={`absolute -right-10 top-2 p-1.5 rounded-full bg-zinc-900 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-[#C6A87C] hover:bg-zinc-800 ${isSpeaking ? 'text-[#C6A87C] opacity-100' : ''}`}
                                        title="Escuchar"
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Action Components (Hybrid Agent) */}
                            {msg.sender === 'bot' && msg.action === 'show_payment_gateway' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-4 w-full bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                                >
                                    <div className="h-1 bg-gradient-to-r from-[#C6A87C] to-purple-600"></div>
                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-white font-medium">Pasarela de Pago Segura</h3>
                                                <p className="text-xs text-zinc-500">Procesado por Stripe / MercadoPago</p>
                                            </div>
                                            <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] rounded border border-green-500/20">
                                                SSL Encriptado
                                            </div>
                                        </div>

                                        <div className="bg-zinc-950 rounded-lg p-3 mb-4 border border-white/5">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-zinc-400">Concepto:</span>
                                                <span className="text-white">Asesoría Legal Express</span>
                                            </div>
                                            <div className="flex justify-between text-lg font-bold">
                                                <span className="text-zinc-400">Total:</span>
                                                <span className="text-[#C6A87C]">$50.00 USD</span>
                                            </div>
                                        </div>

                                        <button className="w-full py-2.5 bg-[#C6A87C] hover:bg-[#b0966f] text-black font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                            <span>Pagar Ahora</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                        </button>

                                        <p className="text-[10px] text-center text-zinc-600 mt-2">
                                            Al pagar aceptas los términos y condiciones del servicio.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {msg.sender === 'bot' && msg.action === 'schedule_appointment' && (
                                (() => {
                                    // Only show calendar if it's the LATEST bot message with this action
                                    const botActionMessages = messages.filter(m => m.sender === 'bot' && m.action === 'schedule_appointment');
                                    const isLatest = botActionMessages[botActionMessages.length - 1]?.id === msg.id;

                                    if (!isLatest) return null;

                                    return (
                                        <CalendarBooking
                                            sessionId={sessionId}
                                            onSelect={(datetime: string) => onSend?.(datetime)}
                                        />
                                    );
                                })()
                            )}

                            {/* Options / Choices (Typebot Integration) - MOVED OUTSIDE BUBBLE */}
                            {msg.sender === 'bot' && msg.options && msg.options.length > 0 && msg.action !== 'schedule_appointment' && (
                                <div className="mt-4 mb-2 space-y-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    <div className="flex items-center gap-2 px-1">
                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest whitespace-nowrap">
                                            Selecciona una respuesta
                                        </span>
                                        <div className="h-[1px] flex-1 bg-white/10"></div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 justify-start items-center">
                                        {msg.options.map((option: string, idx: number) => (
                                            <motion.button
                                                key={idx}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(198, 168, 124, 0.2)', borderColor: 'rgba(198, 168, 124, 0.4)' }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onSend?.(option)}
                                                className="px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-zinc-200 text-sm font-medium transition-all shadow-lg flex items-center gap-2 group ring-1 ring-white/5"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#C6A87C] shadow-[0_0_8px_rgba(198, 168, 124, 0.8)] group-hover:animate-pulse"></div>
                                                {option}
                                            </motion.button>
                                        ))}

                                        {/* "Escribe lo que buscas" Hint Tag */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: (msg.options?.length || 0) * 0.1 + 0.3 }}
                                            className="px-4 py-2 rounded-full border border-dashed border-white/10 bg-transparent text-zinc-600 text-[11px] italic flex items-center gap-2"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                                            O escribe lo que buscas...
                                        </motion.div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata / Sources */}
                            <div className="flex items-center gap-2 mt-1 px-1">
                                <span className="text-[10px] text-zinc-500">{formatTime(msg.timestamp)}</span>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="flex gap-1">
                                        {msg.sources.map((source: { title: string, url: string }, idx: number) => (
                                            <a
                                                key={idx}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-white/10 hover:text-[#C6A87C] hover:border-[#C6A87C]/30 transition-colors"
                                            >
                                                {source.title || 'Fuente'}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Escalation Button (Negative Intent) */}
                            {msg.sender === 'bot' && msg.escalate && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-2 w-full"
                                >
                                    <button className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs py-2 px-3 rounded-lg transition-colors">
                                        <AlertCircle size={14} />
                                        Hablar con un Humano
                                    </button>
                                </motion.div>
                            )}
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

            <div ref={bottomRef} />
        </div>
    );
};
