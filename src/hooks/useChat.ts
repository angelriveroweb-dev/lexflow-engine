import { useState, useEffect, useCallback } from 'react';
import { config } from '../config';
import { getVisitorId } from '@/lib/analytics';

export interface Message {
    id: string;
    text?: string;
    image?: string;
    video?: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    options?: string[];
    action?: string;
    file?: { name: string; type: string; url?: string };
    suggestions?: string[];
    sources?: { title: string; url: string }[];
    escalate?: boolean;
}

export interface UseChatProps {
    clientId: string;
}

export const useChat = ({ clientId }: UseChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    // Persistent Session ID (Simple)
    const [sessionId] = useState(() => {
        if (typeof window === 'undefined') return '';
        const stored = localStorage.getItem('simple_chat_session_id');
        if (stored) return stored;
        const newId = crypto.randomUUID();
        localStorage.setItem('simple_chat_session_id', newId);
        return newId;
    });

    // Load History
    useEffect(() => {
        if (!sessionId) return;
        const storedMessages = localStorage.getItem(`simple_chat_history_${sessionId}`);
        if (storedMessages) {
            try {
                const parsed = JSON.parse(storedMessages);
                setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        } else {
            // Initial Welcome Message
            setMessages([{
                id: 'welcome',
                text: config.chatbot.messages.welcome,
                sender: 'bot',
                timestamp: new Date(),
                options: (config.chatbot.messages as any).suggestions || []
            }]);
        }
    }, [sessionId]);

    // Save History
    useEffect(() => {
        if (messages.length > 0 && sessionId) {
            localStorage.setItem(`simple_chat_history_${sessionId}`, JSON.stringify(messages));
        }
    }, [messages, sessionId]);

    const sendMessage = useCallback(async (text: string, file?: File) => {
        if ((!text.trim() && !file)) return;

        const userMsg: Message = {
            id: crypto.randomUUID(),
            text,
            sender: 'user',
            timestamp: new Date(),
            file: file ? { name: file.name, type: file.type, url: URL.createObjectURL(file) } : undefined
        };

        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('sessionId', sessionId);
            formData.append('text', text);
            formData.append('clientId', clientId);
            formData.append('visitorId', getVisitorId());

            // Standard n8n/Typebot metadata format
            formData.append('metadata', JSON.stringify({
                clientId,
                visitorId: getVisitorId(),
                url: typeof window !== 'undefined' ? window.location.href : '',
                timestamp: new Date().toISOString()
            }));

            if (file) {
                formData.append('file', file);
                formData.append('action', 'file_upload');
            } else {
                formData.append('action', 'user_message');
            }

            // Direct n8n Webhook
            const webhookUrl = config.chatbot.n8nWebhook || config.chatbot.webhookUrl;

            const response = await fetch(webhookUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

            const data = await response.json();
            console.log("n8n Response:", data);

            // Flexible Parsing logic
            let botText = '';
            let suggestions: string[] = [];
            let action: string | undefined = undefined;

            // Normalize data to an object (handle n8n array)
            const normalizedData = Array.isArray(data) && data.length > 0 ? data[0] : data;

            if (typeof normalizedData === 'object' && normalizedData !== null) {
                botText = normalizedData.text || normalizedData.output || normalizedData.message || '';
                suggestions = normalizedData.suggestions || normalizedData.options || [];
                action = normalizedData.action;

                // CRITICAL: If the text itself is JS (e.g. LLM returned a stringified JSON with markers)
                if (typeof botText === 'string' && (botText.trim().startsWith('{') || botText.trim().includes('```json'))) {
                    try {
                        let cleanText = botText.trim();
                        if (cleanText.includes('```json')) {
                            // Extract content between backticks
                            const match = cleanText.match(/```json\s*([\s\S]*?)\s*```/);
                            if (match) cleanText = match[1].trim();
                        }

                        const parsed = JSON.parse(cleanText);
                        if (parsed.text) botText = parsed.text;
                        if (parsed.suggestions) suggestions = parsed.suggestions;
                        if (parsed.action) action = parsed.action;
                    } catch (e) {
                        console.warn("Failed to parse botText as JSON fallback", e);
                    }
                }
            } else if (typeof normalizedData === 'string') {
                botText = normalizedData;
            }

            const botMsg: Message = {
                id: crypto.randomUUID(),
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

        } catch (error) {
            console.error('Chat Error:', error);
            setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                text: "Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo.",
                sender: 'bot',
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, clientId]);

    const clearHistory = () => {
        localStorage.removeItem(`simple_chat_history_${sessionId}`);
        localStorage.removeItem('simple_chat_session_id');
        setMessages([{
            id: 'welcome-reset',
            text: config.chatbot.messages.welcome,
            sender: 'bot',
            timestamp: new Date(),
            options: (config.chatbot.messages as any).suggestions || []
        }]);
        window.location.reload();
    };

    return {
        messages,
        isLoading,
        sendMessage,
        clearHistory,
        isOpen,
        setIsOpen,
        sessionId
    };
};
