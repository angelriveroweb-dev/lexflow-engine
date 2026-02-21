import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '../types';
import type { LexFlowConfig } from '../core/ConfigLoader';
import { getVisitorId, generateUUID } from '../lib/utils';

export interface UseChatProps {

    config: LexFlowConfig;
    metadata?: Record<string, any>;
    externalSessionId?: string;
}

export const useChat = ({ config, metadata, externalSessionId }: UseChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Persistent Session ID
    const [sessionId] = useState(() => {
        if (typeof window === 'undefined') return '';

        // Priority for external session ID
        if (externalSessionId) return externalSessionId;

        const stored = localStorage.getItem(`lexflow_session_id_${config.id}`);
        if (stored) return stored;

        const newId = generateUUID();
        localStorage.setItem(`lexflow_session_id_${config.id}`, newId);
        return newId;
    });

    // Load History
    useEffect(() => {
        if (!sessionId) return;
        const storedMessages = localStorage.getItem(`lexflow_history_${sessionId}`);
        if (storedMessages) {
            try {
                const parsed = JSON.parse(storedMessages);
                setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            } catch (e) {
                console.error("LexFlow: Failed to parse history", e);
            }
        } else {
            // Initial Welcome Message from Config
            setMessages([{
                id: 'welcome',
                text: config.messages.welcome,
                sender: 'bot',
                timestamp: new Date(),
                options: config.messages.suggestions || []
            }]);
        }
    }, [sessionId, config]);

    // Save History
    useEffect(() => {
        if (messages.length > 0 && sessionId) {
            localStorage.setItem(`lexflow_history_${sessionId}`, JSON.stringify(messages));
        }
    }, [messages, sessionId]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const abortRequest = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsAnalyzing(false);
            setIsLoading(false);
            setMessages(prev => [...prev, {
                id: generateUUID(),
                text: "❌ La operación ha sido cancelada.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        }
    }, []);

    const sendMessage = useCallback(async (text: string, file?: File) => {
        if ((!text.trim() && !file)) return;

        const userMsg: Message = {
            id: generateUUID(),
            text,
            sender: 'user',
            timestamp: new Date(),
            file: file ? { name: file.name, type: file.type, url: URL.createObjectURL(file) } : undefined
        };

        setMessages(prev => [...prev, userMsg]);

        if (file) {
            setIsAnalyzing(true);
        } else {
            setIsLoading(true);
        }

        try {
            abortControllerRef.current = new AbortController();
            const formData = new FormData();

            // ALWAYS read visitorId directly from localStorage via utility (standardized)
            const effectiveClientId = metadata?.clientId || config.id;
            const effectiveVisitorId = getVisitorId();

            formData.append('sessionId', sessionId);
            formData.append('text', text);
            formData.append('clientId', effectiveClientId);
            formData.append('visitorId', effectiveVisitorId);

            formData.append('metadata', JSON.stringify({
                clientId: effectiveClientId,
                visitorId: effectiveVisitorId,
                sessionId: sessionId,
                url: typeof window !== 'undefined' ? window.location.href : '',
                timestamp: new Date().toISOString(),
                ...metadata // Spread custom metadata
            }));

            if (file) {
                formData.append('file', file);
                formData.append('action', 'file_upload');
            } else {
                formData.append('action', 'user_message');
            }

            const response = await fetch(config.webhookUrl, {
                method: 'POST',
                body: formData,
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

            const data = await response.json();

            // Flexible Parsing
            const normalizedData = Array.isArray(data) && data.length > 0 ? data[0] : data;
            let botText = '';
            let suggestions: string[] = [];
            let action: string | undefined = undefined;

            if (typeof normalizedData === 'object' && normalizedData !== null) {
                botText = normalizedData.text || normalizedData.output || normalizedData.message || '';
                suggestions = normalizedData.suggestions || normalizedData.options || [];
                action = normalizedData.action;

                // Handle stringified JSON in text
                if (typeof botText === 'string' && (botText.trim().startsWith('{') || botText.trim().includes('```json'))) {
                    try {
                        let cleanText = botText.trim();
                        if (cleanText.includes('```json')) {
                            const match = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
                            if (match) cleanText = match[1].trim();
                        }
                        const parsed = JSON.parse(cleanText);
                        if (parsed.text) botText = parsed.text;
                        if (parsed.suggestions) suggestions = parsed.suggestions;
                        if (parsed.action) action = parsed.action;
                    } catch (e) { }
                }
            } else {
                botText = String(normalizedData);
            }

            const botMsg: Message = {
                id: generateUUID(),
                text: botText,
                sender: 'bot',
                timestamp: new Date(),
                suggestions: suggestions.length > 0 ? suggestions : (normalizedData.suggestions || normalizedData.options || []),
                options: suggestions.length > 0 ? suggestions : (normalizedData.suggestions || normalizedData.options || []),
                action: action,
                image: normalizedData.image,
                video: normalizedData.video
            };

            setMessages(prev => [...prev, botMsg]);

        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log('LexFlow: Request aborted by user');
                return;
            }
            console.error('LexFlow: Chat Error:', error);
            setMessages(prev => [...prev, {
                id: generateUUID(),
                text: "Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    }, [sessionId, config, metadata]);

    const clearHistory = () => {
        localStorage.removeItem(`lexflow_history_${sessionId}`);
        localStorage.removeItem('visitor_session_id');
        setMessages([{
            id: 'welcome-reset',
            text: config.messages.welcome,
            sender: 'bot',
            timestamp: new Date(),
            options: config.messages.suggestions || []
        }]);
        window.location.reload();
    };

    return {
        messages,
        isLoading,
        isAnalyzing,
        sendMessage,
        clearHistory,
        sessionId,
        abortRequest
    };
};
