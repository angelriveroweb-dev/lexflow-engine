import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Paperclip, X as XIcon } from "lucide-react";
import { useSpeech } from "../../hooks/useSpeech";

interface ChatInputProps {
    onSend: (text: string, file?: File) => void;
    isLoading: boolean;
    primaryColor: string;
    gradient: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isLoading, gradient }) => {
    const [inputValue, setInputValue] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isListening, startListening, stopListening, transcript, setTranscript } = useSpeech();

    useEffect(() => {
        if (transcript) setInputValue(transcript);
    }, [transcript]);

    const handleSend = () => {
        if ((!inputValue.trim() && !selectedFile) || isLoading) return;
        onSend(inputValue, selectedFile || undefined);
        setInputValue("");
        setTranscript("");
        setSelectedFile(null);
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    return (
        <div className="relative overflow-hidden transition-all duration-300">
            {isListening && (
                <div className={"absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r " + gradient + " text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-2 shadow-lg"}>
                    <Mic size={12} /> Escuchando...
                </div>
            )}

            {selectedFile && (
                <div className="mb-2 mx-2 p-2 bg-zinc-800/80 rounded-lg flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-white/5 rounded flex items-center justify-center text-xs text-zinc-400 font-mono">
                            {selectedFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                        </div>
                        <span className="text-xs text-zinc-300 truncate max-w-[150px]">{selectedFile.name}</span>
                    </div>
                    <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-colors">
                        <XIcon size={14} />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-2 bg-zinc-900/50 p-2 rounded-xl border border-white/5 focus-within:border-white/20 transition-colors">
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            setSelectedFile(e.target.files[0]);
                        }
                    }}
                    accept="image/*,.pdf,.doc,.docx"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
                >
                    <Paperclip size={20} />
                </button>

                <button
                    onClick={() => isListening ? stopListening() : startListening()}
                    className={"p-2 rounded-lg transition-colors " + (isListening ? "text-[#C6A87C] bg-white/5" : "text-zinc-500 hover:text-white")}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                </button>

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-500 resize-none max-h-32 py-2"
                    rows={1}
                />

                <button
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && !selectedFile) || isLoading}
                    className={"p-2 bg-gradient-to-tr " + gradient + " text-white rounded-lg hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};