import { useState, useCallback, useEffect, useRef } from 'react';

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

    useEffect(() => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.lang = 'es-ES';
            recognitionRef.current.interimResults = false;

            recognitionRef.current.onstart = () => setIsListening(true);
            recognitionRef.current.onend = () => setIsListening(false);

            recognitionRef.current.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                setTranscript(text);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript('');
            recognitionRef.current.start();
        } else {
            console.warn("Navegador no soporta reconocimiento de voz.");
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!synth) return;

        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synth.speak(utterance);
    }, [synth]);

    const stopSpeaking = useCallback(() => {
        if (synth) {
            synth.cancel();
            setIsSpeaking(false);
        }
    }, [synth]);

    return {
        isListening,
        startListening,
        stopListening,
        transcript,
        setTranscript,
        speak,
        isSpeaking,
        stopSpeaking
    };
};
