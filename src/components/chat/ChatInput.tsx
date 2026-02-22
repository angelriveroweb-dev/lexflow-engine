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
                <div className="mb-3 mx-2 p-3 bg-zinc-900/60 backdrop-blur-md rounded-xl flex items-center justify-between border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden group">
                    {/* Subtle gradient glow effect behind the file */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner border border-white/10 ${selectedFile.type.includes('pdf') ? 'bg-red-500/10 text-red-400' : selectedFile.type.includes('image') ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-300'}`}>
                            {selectedFile.name.split(".").pop()?.toUpperCase().substring(0, 3) || "DOC"}
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-sm font-medium text-zinc-100 truncate w-[160px] tracking-wide">{selectedFile.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Listo para envío
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedFile(null)}
                        className="relative z-10 p-2 bg-black/20 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-all duration-300 border border-transparent hover:border-red-500/30 group/btn"
                        title="Cancelar archivo"
                    >
                        <XIcon size={14} className="group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* Animated bottom border indicating readiness */}
                    <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#C6A87C] to-transparent w-full opacity-50"></div>
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