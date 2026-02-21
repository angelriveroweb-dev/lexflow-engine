import { createSupabaseClient } from '../lib/supabase';

export interface LexFlowConfig {
    id: string;
    name: string;
    ui: {
        title: string;
        subtitle: string;
        avatarUrl: string;
        primaryColor: string;
        accentColor: string;
        gradient: string;
        launcherLabel: string;
    };
    messages: {
        welcome: string;
        suggestions: string[];
        fallback: string;
    };
    features: {
        voice: boolean;
        files: boolean;
        calendar: boolean;
    };
    webhookUrl: string;
}

export class ConfigLoader {
    private supabaseUrl: string;
    private supabaseKey: string;

    constructor(url: string, key: string) {
        this.supabaseUrl = url;
        this.supabaseKey = key;
    }

    async fetchConfig(id: string): Promise<LexFlowConfig | null> {
        const supabase = createSupabaseClient(this.supabaseUrl, this.supabaseKey);

        // Mocking for development purposes if the ID is 'demo'
        if (id === 'demo' || !this.supabaseUrl) {
            return this.getMockConfig();
        }

        try {
            const { data, error } = await supabase
                .from('lexflow_configs')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.warn(`LexFlow: Config ID ${id} not found in lexflow_configs, falling back.`, error);
                throw error;
            }

            return {
                id: data.id,
                name: data.bot_name,
                ui: {
                    title: data.ui_title,
                    subtitle: data.ui_subtitle,
                    avatarUrl: data.ui_avatar_url || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop',
                    primaryColor: data.ui_primary_color,
                    accentColor: data.ui_accent_color,
                    gradient: data.ui_gradient,
                    launcherLabel: data.ui_launcher_label
                },
                messages: {
                    welcome: data.msg_welcome,
                    suggestions: Array.isArray(data.msg_suggestions) ? data.msg_suggestions : [],
                    fallback: 'Lo siento, no pude procesar tu solicitud.'
                },
                features: {
                    voice: !!data.feat_voice,
                    files: !!data.feat_files,
                    calendar: !!data.feat_calendar
                },
                webhookUrl: data.webhook_url || 'https://n8n.angelstudio.design/webhook/test'
            };
        } catch (err) {
            return this.getMockConfig();
        }
    }

    private getMockConfig(): LexFlowConfig {
        return {
            id: 'demo',
            name: 'LexFlow Demo',
            ui: {
                title: 'LexFlow Engine Demo',
                subtitle: 'Core Engine Standalone',
                avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop',
                primaryColor: '#0f3460',
                accentColor: 'bg-indigo-500',
                gradient: 'from-[#0f3460] to-[#1a1a2e]',
                launcherLabel: 'Asistente Digital'
            },
            messages: {
                welcome: 'Hola, soy el Core Engine de LexFlow. ¿Qué deseas probar hoy?',
                suggestions: ['Subir Archivo 📂', 'Mensaje de Voz 🎙️', 'Agendar Cita 📅'],
                fallback: 'Lo siento, no pude procesar tu solicitud.'
            },
            features: {
                voice: true,
                files: true,
                calendar: true
            },
            webhookUrl: 'https://n8n.angelstudio.design/webhook/test'
        };
    }
}
