import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Paperclip, X as XIcon, AlertCircle } from "lucide-react";
import { useSpeech } from "../../hooks/useSpeech";

interface ChatInputProps {
    onSend: (text: string, file?: File) => void;
    isLoading: boolean;
    primaryColor: string;
    gradient: string;
    maxFileSizeMB?: number;
    featFiles?: boolean;
    featVoice?: boolean;
}

const ACCEPTED_TYPES = "image/*,.pdf,.doc,.docx";
const MAX_TEXTAREA_HEIGHT = 128; // px

export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    isLoading,
    gradient,
    maxFileSizeMB = 10,
    featFiles = true,
    featVoice = true
}) => {
    const [inputValue, setInputValue] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isListening, isSupported, startListening, stopListening, transcript, setTranscript } = useSpeech();

    useEffect(() => {
        if (transcript) setInputValue(transcript);
    }, [transcript]);

    const handleSend = () => {
        if ((!inputValue.trim() && !selectedFile) || isLoading) return;
        onSend(inputValue, selectedFile || undefined);
        setInputValue("");
        setTranscript("");
        setSelectedFile(null);
        setFileError(null);
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
        // Auto-grow with max height guard
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, MAX_TEXTAREA_HEIGHT) + "px";
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        const maxBytes = maxFileSizeMB * 1024 * 1024;
        if (file.size > maxBytes) {
            setFileError(`El archivo supera ${maxFileSizeMB}MB. Máx permitido: ${maxFileSizeMB}MB.`);
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setFileError(null);
        setSelectedFile(file);
        // Reset input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getFileColor = (type: string) => {
        if (type.includes('pdf')) return 'bg-red-500/10 text-red-400';
        if (type.includes('image')) return 'bg-blue-500/10 text-blue-400';
        return 'bg-zinc-800 text-zinc-300';
    };

    const canSend = (inputValue.trim() || selectedFile) && !isLoading;

    return (
        <div className="relative overflow-hidden transition-all duration-300">
            {isListening && (
                <div className={"absolute -top-10 left-1/2 -translate-x-1/2 bg-gradient-to-r " + gradient + " text-white text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-2 shadow-lg z-10"}>
                    <Mic size={12} aria-hidden /> <span>Escuchando...</span>
                </div>
            )}

            {fileError && (
                <div className="mb-2 mx-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <span className="text-xs text-red-400">{fileError}</span>
                    <button
                        onClick={() => setFileError(null)}
                        className="ml-auto text-red-400 hover:text-red-300"
                        aria-label="Cerrar error"
                    >
                        <XIcon size={12} />
                    </button>
                </div>
            )}

            {selectedFile && (
                <div className="mb-3 mx-2 p-3 bg-zinc-900/60 backdrop-blur-md rounded-xl flex items-center justify-between border border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="flex items-center gap-4 relative z-10 w-full overflow-hidden">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shadow-inner border border-white/10 ${getFileColor(selectedFile.type)}`}>
                            {selectedFile.name.split(".").pop()?.toUpperCase().substring(0, 3) || "DOC"}
                        </div>
                        <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-sm font-medium text-zinc-100 truncate w-[160px] tracking-wide">{selectedFile.name}</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Listo para envío
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => setSelectedFile(null)}
                        className="relative z-10 p-2 bg-black/20 hover:bg-red-500/20 rounded-full text-zinc-400 hover:text-red-400 transition-all duration-300 border border-transparent hover:border-red-500/30"
                        aria-label="Cancelar archivo"
                        title="Cancelar archivo"
                    >
                        <XIcon size={14} />
                    </button>

                    <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-[#C6A87C] to-transparent w-full opacity-50"></div>
                </div>
            )}

            <div className="flex items-end gap-2 bg-zinc-900/50 p-2 rounded-xl border border-white/5 focus-within:border-white/20 transition-colors">
                {featFiles && (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept={ACCEPTED_TYPES}
                            aria-label="Adjuntar archivo"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 rounded-lg text-zinc-500 hover:bg-white/5 hover:text-white transition-colors"
                            disabled={isLoading}
                            aria-label="Adjuntar archivo"
                            title={`Adjuntar PDF, imagen o Word (máx ${maxFileSizeMB}MB)`}
                        >
                            <Paperclip size={20} />
                        </button>
                    </>
                )}

                {featVoice && isSupported && (
                    <button
                        onClick={() => isListening ? stopListening() : startListening()}
                        className={"p-2 rounded-lg transition-colors " + (isListening ? "text-[#C6A87C] bg-white/5" : "text-zinc-500 hover:text-white hover:bg-white/5")}
                        aria-label={isListening ? "Detener dictado" : "Dictar mensaje por voz"}
                        title={isListening ? "Detener dictado" : "Dictar por voz"}
                    >
                        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                )}

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-500 resize-none py-2"
                    rows={1}
                    style={{ maxHeight: MAX_TEXTAREA_HEIGHT + "px" }}
                    aria-label="Mensaje"
                    disabled={isLoading}
                />

                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={"p-2 bg-gradient-to-tr " + gradient + " text-white rounded-lg hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"}
                    aria-label="Enviar mensaje"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};
