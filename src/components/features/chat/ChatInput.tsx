import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeech } from '../../../hooks/useSpeech';
import { config } from '../../../config';

interface ChatInputProps {
    onSend: (text: string) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const { ui } = config.chatbot;
    const [inputValue, setInputValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { isListening, startListening, stopListening, transcript, setTranscript } = useSpeech();

    // Sync speech transcript to input
    useEffect(() => {
        if (transcript) {
            setInputValue(transcript);
        }
    }, [transcript]);

    const handleSend = () => {
        if (!inputValue.trim() || isLoading) return;
        onSend(inputValue);
        setInputValue('');
        setTranscript(''); // Clear speech buffer

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        // Auto-grow
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <div className="relative overflow-hidden transition-all duration-300">
            {/* Visual Feedback for Voice */}
            {isListening && (
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r ${ui.gradient} text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-2 shadow-lg`}>
                    <Mic size={12} /> Escuchando...
                </div>
            )}

            <div className="flex items-end gap-2 bg-zinc-800/50 p-2 rounded-xl border border-white/5 focus-within:border-blue-500/50 transition-colors">
                <button
                    onClick={toggleListening}
                    className={`p-2 rounded-lg transition-colors ${isListening
                        ? 'bg-white/10 text-[#C6A87C] hover:bg-white/20'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                        }`}
                    title={isListening ? "Detener grabación" : "Usar micrófono"}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={ui.placeholder}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 resize-none max-h-32 py-2"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className={`p-2 bg-gradient-to-tr ${ui.gradient} text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C6A87C]/10`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
