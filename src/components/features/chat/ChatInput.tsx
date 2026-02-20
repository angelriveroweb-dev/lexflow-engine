import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import { useSpeech } from '../../../hooks/useSpeech';
import { config } from '../../../config';

interface ChatInputProps {
    onSend: (text: string, file?: File) => void;
    isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading }) => {
    const { ui } = config.chatbot;
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isListening, startListening, stopListening, transcript, setTranscript } = useSpeech();

    // Sync speech transcript to input
    useEffect(() => {
        if (transcript) {
            setInputValue(transcript);
        }
    }, [transcript]);

    const handleSend = () => {
        if ((!inputValue.trim() && !selectedFile) || isLoading) return;
        onSend(inputValue, selectedFile || undefined);
        setInputValue('');
        setTranscript(''); // Clear speech buffer
        setSelectedFile(null); // Clear file

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
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

            {/* File Preview */}
            {selectedFile && (
                <div className="mb-2 mx-2 p-2 bg-zinc-800/80 rounded-lg flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-xs text-zinc-400 font-mono">
                            {selectedFile.name.split('.').pop()}
                        </div>
                        <span className="text-xs text-zinc-300 truncate max-w-[150px]">{selectedFile.name}</span>
                    </div>
                    <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2 bg-zinc-800/50 p-2 rounded-xl border border-white/5 focus-within:border-blue-500/50 transition-colors">
                {/* File Upload Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                    title="Adjuntar archivo"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-paperclip"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                </button>

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
                    placeholder={selectedFile ? "Añadir comentario..." : ui.placeholder}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-500 resize-none max-h-32 py-2"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && !selectedFile) || isLoading}
                    className={`p-2 bg-gradient-to-tr ${ui.gradient} text-white rounded-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#C6A87C]/10`}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
