import React, { useEffect, useRef } from 'react';
import { Bot, User, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeech } from '../../hooks/useSpeech';
import { CalendarBooking } from './CalendarBooking';
import type { Message } from '../../types';

interface ChatWindowProps {
    messages: Message[];
    isLoading: boolean;
    isAnalyzing?: boolean;
    onSend?: (text: string, file?: File) => void;
    sessionId: string;
    config: {
        ui: {
            primaryColor: string;
            accentColor: string;
            gradient: string;
            avatarUrl: string;
        };
        webhookUrl: string;
    };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, isAnalyzing, onSend, sessionId, config }) => {
    const bottomRef = useRef<HTMLDivElement>(null);
    const { speak, isSpeaking, stopSpeaking } = useSpeech();
    const { ui } = config;

    useEffect(() => {
        const timer = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(date);
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50 scrollbar-hide">
            <AnimatePresence>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden ${msg.sender === 'bot' ? `bg-gradient-to-tr ${ui.gradient}` : 'bg-gray-200'}`}>
                            {msg.sender === 'bot' ? (
                                ui.avatarUrl ? <img src={ui.avatarUrl} alt="B" className="w-full h-full object-cover" /> : <Bot size={16} className="text-white" />
                            ) : (
                                <User size={16} className="text-gray-500" />
                            )}
                        </div>

                        {/* Message Bubble */}
                        <div className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-2xl text-sm leading-relaxed relative group shadow-sm ${msg.sender === 'user'
                                ? 'bg-white text-gray-800 border border-gray-100 rounded-tr-sm p-4'
                                : `bg-white text-gray-800 border border-gray-100 rounded-tl-sm ${msg.text ? 'p-4' : 'p-0'}`
                                }`}>

                                {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                                {msg.image && (
                                    <div className={`${msg.text ? 'mt-2' : ''} rounded-lg overflow-hidden`}>
                                        <img src={msg.image} alt="Bot Image" className="max-w-full h-auto" />
                                    </div>
                                )}

                                {msg.file && (
                                    <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2 max-w-[200px]">
                                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500 font-mono">
                                            {msg.file.name.split('.').pop()?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-700 truncate">{msg.file.name}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Audio Output */}
                                {msg.sender === 'bot' && msg.text && (
                                    <button
                                        onClick={() => isSpeaking ? stopSpeaking() : speak(msg.text!)}
                                        className={`absolute -right-10 top-2 p-1.5 rounded-full bg-white shadow-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-gray-600 ${isSpeaking ? 'text-blue-500 opacity-100' : ''}`}
                                    >
                                        <Volume2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Bot Actions */}
                            {msg.sender === 'bot' && msg.action === 'schedule_appointment' && (
                                <CalendarBooking
                                    sessionId={sessionId}
                                    webhookUrl={config.webhookUrl}
                                    primaryColor={ui.primaryColor}
                                    onSelect={(datetime) => onSend?.(datetime)}
                                />
                            )}

                            {/* Options */}
                            {msg.sender === 'bot' && msg.options && msg.options.length > 0 && msg.action !== 'schedule_appointment' && (
                                <div className="mt-3 flex flex-wrap gap-2 justify-start">
                                    {msg.options.map((option, idx) => (
                                        <motion.button
                                            key={idx}
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => onSend?.(option)}
                                            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:border-gray-400 transition-all shadow-sm active:scale-95"
                                        >
                                            {option}
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <div className="mt-1 px-1">
                                <span className="text-[10px] text-gray-400">{formatTime(msg.timestamp)}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {isLoading && (
                <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${ui.gradient} flex items-center justify-center shrink-0`}>
                        <Bot size={16} className="text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                    </div>
                </div>
            )}

            {isAnalyzing && (
                <div className="text-center py-4">
                    <p className="text-xs text-gray-500 animate-pulse">Analizando archivo...</p>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};
