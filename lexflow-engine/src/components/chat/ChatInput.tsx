import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Paperclip } from 'lucide-react';
import { useSpeech } from '../../hooks/useSpeech';

interface ChatInputProps {
    onSend: (text: string, file?: File) => void;
    isLoading: boolean;
    primaryColor: string;
    gradient: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, primaryColor, gradient }) => {
    const [inputValue, setInputValue] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isListening, startListening, stopListening, transcript, setTranscript } = useSpeech();

    useEffect(() => {
        if (transcript) {
            setInputValue(transcript);
        }
    }, [transcript]);

    const handleSend = () => {
        if ((!inputValue.trim() && !selectedFile) || isLoading) return;
        onSend(inputValue, selectedFile || undefined);
        setInputValue('');
        setTranscript('');
        setSelectedFile(null);

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
        <div className="relative overflow-hidden p-4 bg-white border-t border-gray-100">
            {isListening && (
                <div className={`absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r ${gradient} text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-2 shadow-lg`}>
                    <Mic size={12} /> Escuchando...
                </div>
            )}

            {selectedFile && (
                <div className="mb-2 p-2 bg-gray-50 rounded-lg flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-[10px] text-gray-500 font-mono">
                            {selectedFile.name.split('.').pop()?.toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-700 truncate max-w-[150px]">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-400">✕</button>
                </div>
            )}

            <div className="flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-gray-300 transition-colors">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                >
                    <Paperclip size={20} />
                </button>

                <button
                    onClick={toggleListening}
                    className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:bg-gray-200'}`}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder:text-gray-400 resize-none max-h-32 py-2"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && !selectedFile) || isLoading}
                    className={`p-2 text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-all shadow-md`}
                    style={{ backgroundColor: primaryColor }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
