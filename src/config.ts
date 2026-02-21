export const config = {
    // Unique Client ID for this Landing Page
    landingClientId: "30727c70-d179-4f1d-ab7b-61d5275c1f31",

    // Webhook for the 'SpeedContactForm' (Leads)
    contactFormWebhook: "https://cartographic-shamika-predetrimental.ngrok-free.dev/webhook-test/contact-form",

    // Supabase Configuration
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },

    // External Links
    bookingUrl: "#contact",
    paymentLink: "https://buy.stripe.com/",
    googleMapsReviewUrl: "https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID",

    // Chatbot Configuration (Typebot API Integration)
    chatbot: {
        typebot: "lead-generation-rssm2ln",
        apiHost: "https://chat.angelstudio.design",
        ui: {
            title: "Asistencia Legal IA 24/7",
            subtitle: "Pre analisis de caso",
            placeholder: "Describa su situación jurídica...",
            launcherLabel: "Escríbenos",
            footerText: "Secretaría Ejecutiva | Respuesta Inmediata",
            avatarUrl: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?q=80&w=400&auto=format&fit=crop", // Senior Paralegal Persona
            primaryColor: "#0f3460",
            gradient: "from-[#0f3460] to-[#1a1a2e]",
            accentColor: "bg-red-500"
        },
        messages: {
            welcome: "Bienvenido a Escobar & Asociados. ¿En qué asunto legal podemos asistirle hoy?",
            suggestions: [
                "⚖️ Asesoría de Divorcio",
                "👶 Pensión Alimenticia",
                "💼 Despido Injustificado",
                "📅 Agendar Cita",
                "💰 Costos de Servicios"
            ],
            reset: "Conversación reiniciada.",
            error: "Error de conexión. Por favor intente nuevamente.",
            fallback: "Disculpe, no he comprendido. ¿Podría reformular?",
            negativeIntentKeywords: ['no me sirve', 'inútil', 'basura', 'humano', 'persona']
        },
        // Hybrid AI Agent Webhook (n8n)
        n8nWebhook: "https://n8n.angelstudio.design/webhook/616e01d1-ca82-45e1-8ef1-be996160ea42",
        webhookUrl: "https://n8n.angelstudio.design/webhook/616e01d1-ca82-45e1-8ef1-be996160ea42",
    },

    // Dynamic Content (Architecture of Persuasion)
    dynamicContent: {
        city: "Veracruz",
        localAnchor: "Frente al Tribunal Superior de Justicia",
        stats: {
            casesWon: 1250,
            experienceYears: 23,
            recoveredAmount: "15.4" // In millions
        },
        specialization: {
            title: "Corporativa", // Penal, Corporativo, Familia
            pain: "Incertidumbre Patrimonio",
            ego: "Protección de Legado",
            hook: "Defensa Estratégica"
        },
        roadmap: [
            { step: "01", title: "Diagnóstico", desc: "Evaluación de Caso 24h con análisis de viabilidad técnica." },
            { step: "02", title: "Estrategia", desc: "Diseño de Defensa a Medida alineada a sus objetivos patrimoniales." },
            { step: "03", title: "Resolución", desc: "Protección en Tribunales con ejecución técnica implacable." }
        ],
        pricing: {
            basic: "Asesoría Básica: Inversión desde $3,500 MXN",
            comprehensive: "Defensa Integral: Inversión según complejidad",
            retainer: "Iguala Mensual: Seguridad Legal Permanente"
        }
    },

    // Real Testimonials Data
    testimonials: [
        {
            name: "Jose Luis Pinzon Pucheta",
            role: "Local Guide",
            text: "Muy grata experiencia. Su equipo demostró gran profesionalismo... resolvieron mi caso de manera eficiente.",
            tags: ["Eficiencia", "Trato Humano"]
        },
        {
            name: "Dhalia Lois",
            role: "Cliente Verificada",
            text: "Gente amable, profesional... me ayudó con la asesoría que me dieron para llevar mi caso sin problema.",
            tags: ["Asesoría Clara"]
        },
        {
            name: "Karina",
            role: "Cliente Verificada",
            text: "Excelente servicio... Atención 100% personalizada y aclaran todas tus dudas!",
            tags: ["Personalización"]
        },
        {
            name: "Gabriel Rafael Cuevas",
            role: "Cliente Verificado",
            text: "Me despacharon bien y legal 10/10.",
            tags: ["Resultado Directo"]
        }
    ],

    // Demo User Data
    demoUser: {
        name: "Cliente Potencial",
        email: "cliente@demo.com",
        whatsapp: "+520000000000"
    },

    // Analytics Configuration
    analytics: {
        webhookUrl: "https://cartographic-shamika-predetrimental.ngrok-free.dev/webhook-test/analytics",
        enabled: true
    }
};