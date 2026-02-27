import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message } from '../types';
import type { LexFlowConfig } from '../core/ConfigLoader';
import { getVisitorId, generateUUID } from '../lib/utils';

export interface UseChatProps {
    config: LexFlowConfig;
    metadata?: Record<string, any>;
    externalSessionId?: string;
}

const MAX_MESSAGES_PER_MINUTE = 15;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;
const MAX_HISTORY_MESSAGES = 100;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useChat = ({ config, metadata, externalSessionId }: UseChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Persistent Session ID — single source of truth
    const [sessionId] = useState(() => {
        if (typeof window === 'undefined') return '';
        if (externalSessionId) return externalSessionId;

        const stored = localStorage.getItem(`lexflow_session_id_${config.id}`);
        if (stored && stored !== 'undefined') return stored;

        const newId = generateUUID();
        localStorage.setItem(`lexflow_session_id_${config.id}`, newId);
        return newId;
    });

    // Rate limiting
    const messageTimes = useRef<number[]>([]);

    const isRateLimited = useCallback((): boolean => {
        const now = Date.now();
        messageTimes.current = messageTimes.current.filter(t => now - t < 60_000);
        return messageTimes.current.length >= MAX_MESSAGES_PER_MINUTE;
    }, []);

    // Load History
    useEffect(() => {
        if (!sessionId) return;
        const storedMessages = localStorage.getItem(`lexflow_history_${sessionId}`);
        if (storedMessages) {
            try {
                const parsed = JSON.parse(storedMessages);
                const limited = parsed.slice(-MAX_HISTORY_MESSAGES);
                setMessages(limited.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
            } catch (e) {
                console.error('LexFlow: Failed to parse history', e);
            }
        } else {
            // Initial welcome message with generic legal fallbacks
            const legalFallbacks = [
                '🛠️ Servicios',
                '📞 Contacto',
                '📋 Modalidades',
                '⚖️ ¿Me pueden ayudar con mi caso?'
            ];

            setMessages([{
                id: 'welcome',
                text: config.messages.welcome,
                sender: 'bot',
                timestamp: new Date(),
                options: (config.messages.suggestions && config.messages.suggestions.length > 0) 
                    ? config.messages.suggestions 
                    : legalFallbacks
            }]);

            // Optional: Request AI to provide dynamic suggestions based on RAG
            // We do this by sending a silent system message if supported by the webhook
            // or just letting the first message handle it. 
            // For now, if no suggestions in config, we could trigger a "start" event
        }
    }, [sessionId, config]);

    // Save History (capped at MAX_HISTORY_MESSAGES)
    useEffect(() => {
        if (messages.length > 0 && sessionId) {
            const toStore = messages.slice(-MAX_HISTORY_MESSAGES);
            localStorage.setItem(`lexflow_history_${sessionId}`, JSON.stringify(toStore));
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
                text: '❌ La operación ha sido cancelada.',
                sender: 'bot',
                timestamp: new Date()
            }]);
        }
    }, []);

    const doFetch = useCallback(async (formData: FormData, signal: AbortSignal): Promise<any> => {
        const response = await fetch(config.webhookUrl, {
            method: 'POST',
            body: formData,
            signal
        });
        if (!response.ok) throw new Error(`Webhook error: ${response.status}`);
        return response.json();
    }, [config.webhookUrl]);

    const sendMessage = useCallback(async (text: string, file?: File) => {
        if (!text.trim() && !file) return;

        if (isRateLimited()) {
            setMessages(prev => [...prev, {
                id: generateUUID(),
                text: '⏳ Por favor esperá un momento antes de enviar otro mensaje.',
                sender: 'bot',
                timestamp: new Date()
            }]);
            return;
        }

        // Validate file size
        const maxBytes = (config.maxFileSizeMB || 10) * 1024 * 1024;
        if (file && file.size > maxBytes) {
            setMessages(prev => [...prev, {
                id: generateUUID(),
                text: `❌ El archivo supera el límite de ${config.maxFileSizeMB || 10}MB. Por favor reducí el tamaño.`,
                sender: 'bot',
                timestamp: new Date()
            }]);
            return;
        }

        messageTimes.current.push(Date.now());

        const userMsg: Message = {
            id: generateUUID(),
            text,
            sender: 'user',
            timestamp: new Date(),
            file: file ? { name: file.name, type: file.type, url: URL.createObjectURL(file) } : undefined
        };

        setMessages(prev => [...prev, userMsg]);
        file ? setIsAnalyzing(true) : setIsLoading(true);

        const effectiveClientId = metadata?.clientId || config.id;
        const effectiveVisitorId = getVisitorId();

        const buildFormData = (): FormData => {
            const fd = new FormData();
            fd.append('sessionId', sessionId);
            fd.append('text', text);
            fd.append('clientId', effectiveClientId);
            fd.append('visitorId', effectiveVisitorId);
            fd.append('metadata', JSON.stringify({
                clientId: effectiveClientId,
                visitorId: effectiveVisitorId,
                sessionId,
                source: 'website',
                url: typeof window !== 'undefined' ? window.location.href : '',
                timestamp: new Date().toISOString(),
                calendarId: config.calendarId,
                ...metadata
            }));
            if (file) {
                fd.append('file', file);
                fd.append('action', 'file_upload');
            } else {
                fd.append('action', 'user_message');
            }
            return fd;
        };

        let data: any = null;
        let attempt = 0;

        try {
            abortControllerRef.current = new AbortController();

            while (attempt <= MAX_RETRIES) {
                try {
                    data = await doFetch(buildFormData(), abortControllerRef.current.signal);
                    break;
                } catch (err: any) {
                    if (err.name === 'AbortError') throw err;
                    if (attempt < MAX_RETRIES) {
                        console.warn(`LexFlow: Request failed, retrying in ${RETRY_DELAY_MS}ms...`, err);
                        await sleep(RETRY_DELAY_MS);
                        attempt++;
                    } else {
                        throw err;
                    }
                }
            }

            // Flexible response parsing
            const normalizedData = Array.isArray(data) && data.length > 0 ? data[0] : data;
            let botText = '';
            let suggestions: string[] = [];
            let action: string | undefined;
            let paymentLink: string | undefined;
            let paymentAmount: string | undefined;
            let leadStatus: string | undefined;
            let isPaid: boolean | undefined;
            let lawyerConfirmed: boolean | undefined;
            let consultationPrice: number | string | undefined;

            if (typeof normalizedData === 'object' && normalizedData !== null) {
                botText = normalizedData.text || normalizedData.output || normalizedData.message || '';
                suggestions = normalizedData.suggestions || normalizedData.options || [];
                action = normalizedData.action;
                paymentLink = normalizedData.paymentLink || normalizedData.payment_link;
                paymentAmount = normalizedData.paymentAmount || normalizedData.payment_amount;
                leadStatus = normalizedData.leadStatus || normalizedData.lead_status;
                isPaid = normalizedData.isPaid;
                lawyerConfirmed = normalizedData.lawyerConfirmed || normalizedData.lawyer_confirmed;
                consultationPrice = normalizedData.consultationPrice || normalizedData.consultation_price;

                // Handle stringified JSON in text field (LLM sometimes wraps in ```json)
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
                        if (parsed.paymentLink || parsed.payment_link) paymentLink = parsed.paymentLink || parsed.payment_link;
                        if (parsed.paymentAmount || parsed.payment_amount) paymentAmount = parsed.paymentAmount || parsed.payment_amount;
                        if (parsed.leadStatus || parsed.lead_status) leadStatus = parsed.leadStatus || parsed.lead_status;
                        if (parsed.isPaid !== undefined) isPaid = parsed.isPaid;
                        if (parsed.lawyerConfirmed !== undefined || parsed.lawyer_confirmed !== undefined) 
                            lawyerConfirmed = parsed.lawyerConfirmed || parsed.lawyer_confirmed;
                        if (parsed.consultationPrice !== undefined || parsed.consultation_price !== undefined) 
                            consultationPrice = parsed.consultationPrice || parsed.consultation_price;
                    } catch (parseErr) {
                        console.warn('LexFlow: Could not parse JSON in bot text', parseErr);
                    }
                }
            } else {
                botText = String(normalizedData);
            }

            const botMsg: Message = {
                id: generateUUID(),
                text: botText,
                sender: 'bot',
                timestamp: new Date(),
                suggestions: suggestions.length > 0 ? suggestions : [],
                options: suggestions.length > 0 ? suggestions : [],
                action,
                image: normalizedData?.image,
                video: normalizedData?.video,
                paymentLink,
                paymentAmount,
                leadStatus,
                isPaid,
                lawyerConfirmed,
                consultationPrice
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
                text: config.messages.fallback || 'Lo siento, hubo un problema de conexión. Por favor, intenta de nuevo.',
                sender: 'bot',
                timestamp: new Date(),
                options: ['🔄 Reintentar', '📞 Contactar por WhatsApp']
            }]);
        } finally {
            setIsLoading(false);
            setIsAnalyzing(false);
            abortControllerRef.current = null;
        }
    }, [sessionId, config, metadata, isRateLimited, doFetch]);

    const clearHistory = useCallback(() => {
        localStorage.removeItem(`lexflow_history_${sessionId}`);
        // Reset state without page reload
        setMessages([{
            id: 'welcome-reset',
            text: config.messages.welcome,
            sender: 'bot',
            timestamp: new Date(),
            options: config.messages.suggestions || []
        }]);
        messageTimes.current = [];
    }, [sessionId, config]);

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
