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
    paymentLink?: string;
    paymentAmount?: string;
    leadStatus?: string;
}
