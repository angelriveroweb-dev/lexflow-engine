import { createSupabaseClient } from '../lib/supabase';

export interface BusinessHours {
    start: number;   // hour 0-23, e.g. 9
    end: number;     // hour 0-23, e.g. 18
    days: number[];  // 0=Sun, 1=Mon ... 6=Sat, e.g. [1,2,3,4,5]
}

export interface LexFlowConfig {
    id: string;
    name: string;
    ui: {
        title: string;
        subtitle: string;
        slogan?: string;
        description?: string;
        avatarUrl: string;
        primaryColor: string;
        accentColor: string;
        gradient: string;
        launcherLabel: string;
        launcherMessages: string[];
        footerText: string;
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
    businessHours: BusinessHours;
    webhookUrl: string;
    maxFileSizeMB: number;
    calendarId?: string | null;
    settings: Record<string, any>;
}

export class ConfigLoader {
    private supabaseUrl: string;
    private supabaseKey: string;

    constructor(url: string, key: string) {
        this.supabaseUrl = url;
        this.supabaseKey = key;
    }

    async fetchConfig(id: string): Promise<LexFlowConfig | null> {
        // Mocking for development purposes if the ID is 'demo'
        if (id === 'demo' || !this.supabaseUrl || !this.supabaseKey) {
            console.log('LexFlow: Using mock config (demo mode or missing credentials)');
            return this.getMockConfig();
        }

        try {
            const supabase = createSupabaseClient(this.supabaseUrl, this.supabaseKey);
            const { data, error } = await supabase
                .from('lexflow_configs')
                .select('*')
                .eq('client_id', id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error || !data) {
                console.warn(`LexFlow: Config for Client ID ${id} not found in lexflow_configs, falling back to mock.`, error);
                return this.getMockConfig();
            }

            return {
                id: data.id,
                name: data.bot_name,
                ui: {
                    title: data.ui_title,
                    subtitle: data.ui_subtitle,
                    slogan: data.ui_slogan,
                    description: data.ui_description,
                    avatarUrl: data.ui_avatar_url || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop',
                    primaryColor: data.ui_primary_color,
                    accentColor: data.ui_accent_color,
                    gradient: data.ui_gradient,
                    launcherLabel: data.ui_launcher_label,
                    launcherMessages: Array.isArray(data.launcher_messages) ? data.launcher_messages : [
                        'Secretaría en línea - ¿En qué puedo asistirle?',
                        'Consulta Prioritaria: Disponibilidad inmediata',
                        'Hable con un especialista ahora'
                    ],
                    footerText: data.footer_text || 'Secretaría Ejecutiva | Respuesta Inmediata'
                },
                messages: {
                    welcome: (data.msg_welcome || `Hola, soy {{bot_name}}. ¿En qué puedo ayudarte hoy?`)
                        .replace(/{{bot_name}}/gi, data.bot_name || 'tu asistente')
                        .replace(/{{ui_title}}/gi, data.ui_title || 'Asistente'),
                    suggestions: Array.isArray(data.msg_suggestions) ? data.msg_suggestions : [],
                    fallback: data.msg_fallback || 'Lo siento, no pude procesar tu solicitud.'
                },
                features: {
                    voice: !!data.feat_voice,
                    files: !!data.feat_files,
                    calendar: !!data.feat_calendar
                },
                businessHours: {
                    start: data.business_hours_start ?? 9,
                    end: data.business_hours_end ?? 18,
                    days: Array.isArray(data.business_days) ? data.business_days : [1, 2, 3, 4, 5]
                },
                maxFileSizeMB: data.max_file_size_mb ?? 10,
                webhookUrl: data.webhook_url || 'https://n8n.angelstudio.design/webhook/f93e0d29-7ccb-4a9f-aaa0-49d0c135df1c',
                calendarId: data.calendar_id || null,
                settings: typeof data.settings === 'object' && data.settings !== null ? data.settings : {}
            };
        } catch (err) {
            console.error('LexFlow: Config load error', err);
            return this.getMockConfig();
        }
    }

    private getMockConfig(): LexFlowConfig {
        return {
            id: 'demo',
            name: 'LexFlow Demo',
            ui: {
                title: 'LexFlow Assistant',
                subtitle: 'Online 24/7',
                slogan: 'Tu asistente legal inteligente',
                description: 'Estamos aquí para ayudarte con tus consultas legales de forma rápida y eficiente.',
                avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop',
                primaryColor: '#0f3460',
                accentColor: '#C6A87C',
                gradient: 'from-[#0f3460] to-[#1a1a2e]',
                launcherLabel: 'Chat',
                launcherMessages: [
                    'Secretaría en línea - ¿En qué puedo asistirle?',
                    'Consulta Prioritaria: Disponibilidad inmediata',
                    'Hable con un especialista ahora'
                ],
                footerText: 'Secretaría Ejecutiva | Respuesta Inmediata'
            },
            messages: {
                welcome: 'Hola, soy LexFlow Demo. ¿En qué asunto legal podemos asistirle hoy?',
                suggestions: ['🛠️ Servicios', '📞 Contacto', '📋 Modalidades', '⚖️ ¿Me pueden ayudar con mi caso?'],
                fallback: 'Lo siento, no pude procesar tu solicitud.'
            },
            features: {
                voice: true,
                files: true,
                calendar: true
            },
            businessHours: {
                start: 9,
                end: 18,
                days: [1, 2, 3, 4, 5]
            },
            maxFileSizeMB: 10,
            webhookUrl: 'https://n8n.angelstudio.design/webhook/f93e0d29-7ccb-4a9f-aaa0-49d0c135df1c',
            calendarId: null,
            settings: {}
        };
    }
}
