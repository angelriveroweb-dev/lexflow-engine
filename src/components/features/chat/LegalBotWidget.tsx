import React, { useState, useEffect } from 'react';
import { useChat } from '../../../hooks/useChat';
import { ChatWindow } from './ChatWindow';
import { ChatInput } from './ChatInput';
import { MessageCircle, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { config } from '../../../config';

interface LegalBotWidgetProps {
    clientId: string;
}

const HOOK_MESSAGES = [
    'Secretaría en línea - ¿En qué puedo asistirle?',
    'Consulta Prioritaria: Disponibilidad inmediata',
    'Litigio Estratégico: Evaluación de caso sin costo',
    'Hable con un especialista ahora'
];

export const LegalBotWidget: React.FC<LegalBotWidgetProps> = ({ clientId }) => {
    const { messages, isLoading, sendMessage, isOpen, setIsOpen, clearHistory, sessionId } = useChat({ clientId });
    const { ui } = config.chatbot;

    const [hookIndex, setHookIndex] = useState(0);

    useEffect(() => {
        const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0 && !isOpen) {
                setIsOpen(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }, [isOpen, setIsOpen]);

    useEffect(() => {
        if (!isOpen) {
            const interval = setInterval(() => {
                setHookIndex((prev) => (prev + 1) % HOOK_MESSAGES.length);
            }, 5000);
            return () => clearInterval(interval);
        } else {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            if (window.innerWidth < 768) {
                document.body.style.overflow = 'hidden';
            }
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isOpen]);

    return (
        <>
            {/* Toggle Button (Floating) */}
            <AnimatePresence>
                {!isOpen && (
                    <div className="fixed bottom-24 right-6 md:bottom-6 z-50 flex items-center gap-3">
                        {/* Hook Messages (Sticky Prompts) */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={hookIndex}
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.8 }}
                                className="bg-zinc-900/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl shadow-xl hidden sm:block"
                            >
                                <p className="text-sm font-medium text-white/90">
                                    {HOOK_MESSAGES[hookIndex]}
                                </p>
                            </motion.div>

                            {/* Mobile version of hook message */}
                            <motion.div
                                key={`mobile-${hookIndex}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="bg-zinc-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg shadow-lg sm:hidden absolute bottom-16 right-0 whitespace-nowrap"
                            >
                                <p className="text-xs font-medium text-white/90">
                                    {HOOK_MESSAGES[hookIndex]}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        <div className="relative">
                            {/* Pulse Effect */}
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 0, 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                }}
                                className={`absolute inset-0 rounded-full bg-gradient-to-tr ${ui.gradient} blur-md`}
                            />

                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setIsOpen(true)}
                                className={`relative w-14 h-14 md:w-16 md:h-16 bg-zinc-950 border border-white/10 text-white rounded-full shadow-2xl transition-all duration-300 group flex items-center justify-center`}
                                style={{ backgroundColor: ui.primaryColor }}
                            >
                                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center p-0.5">
                                    {ui.avatarUrl ? (
                                        <img
                                            src={ui.avatarUrl}
                                            alt="Secretaría"
                                            className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                                    )}
                                </div>

                                {/* Notification Badge */}
                                <motion.span
                                    animate={{
                                        y: [0, -4, 0]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold"
                                >
                                    1
                                </motion.span>
                            </motion.button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Chat Window Container */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9, filter: "blur(10px)" }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: 100, scale: 0.9, filter: "blur(10px)" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-[100] md:inset-auto md:bottom-24 md:right-6 w-full h-[100dvh] md:w-[420px] md:h-[650px] md:max-h-[85vh] flex flex-col bg-zinc-950/80 backdrop-blur-2xl border border-white/10 md:rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden"
                    >
                        <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${ui.gradient} flex items-center justify-center shadow-lg transform -rotate-3 overflow-hidden`}>
                                        {ui.avatarUrl ? (
                                            <img src={ui.avatarUrl} alt="Avatar" className="w-full h-full object-cover rotate-3" />
                                        ) : (
                                            <MessageCircle size={24} className="text-white rotate-3" />
                                        )}
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 ${ui.accentColor} border-2 border-zinc-900 rounded-full shadow-sm`}></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-base tracking-tight">{ui.title}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                        <p className="text-xs text-emerald-500 font-medium uppercase tracking-wider">{ui.subtitle}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={clearHistory}
                                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                    title="Reiniciar chat"
                                >
                                    <Trash2 size={18} />
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Body - Custom Chat Components */}
                        <div className="flex-1 overflow-hidden relative flex flex-col">
                            <ChatWindow messages={messages} isLoading={isLoading} onSend={sendMessage} sessionId={sessionId} />
                        </div>

                        {/* Chat Input and Branding */}
                        <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/5">
                            <ChatInput onSend={sendMessage} isLoading={isLoading} />
                            <div className="mt-4 flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-500 cursor-default">
                                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-zinc-500"></div>
                                <span className="text-[10px] text-zinc-400 font-medium tracking-[0.2em] uppercase">
                                    {ui.footerText}
                                </span>
                                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-zinc-500"></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
