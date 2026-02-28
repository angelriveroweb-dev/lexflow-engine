-- Schema for LexFlow Engine (Recepcionista AI)
-- Based on PRD v1.3 (DEV)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,            -- ID del cliente de la agencia (multi-tenant)
  visitor_id TEXT NOT NULL,           -- ID único del navegador del prospecto
  name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'new',          -- Estados: new | contacted | payment_pending | paid | scheduled | closed | payment_failed
  payment_method TEXT DEFAULT 'mercadopago',
  payment_confirmed_at TIMESTAMPTZ,
  payment_notification_sent_at TIMESTAMPTZ,
  lawyer_confirmed_payment BOOLEAN DEFAULT false,
  scheduled_date DATE,
  scheduled_time TIME,
  ai_summary TEXT,                    -- Resumen generado por IA
  consultation_notes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_client_id ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_visitor_id ON leads(visitor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Table: lexflow_configs (Configuración del Widget por Bot)
CREATE TABLE IF NOT EXISTS lexflow_configs (
  id TEXT PRIMARY KEY,                -- Coincide con el botId del init() o client_id
  client_id TEXT UNIQUE NOT NULL,     -- ID del cliente de la agencia (multi-tenant)
  ui_title TEXT,
  ui_subtitle TEXT,
  ui_avatar_url TEXT,
  ui_primary_color TEXT,
  ui_accent_color TEXT,
  ui_gradient TEXT,
  ui_launcher_label TEXT,
  ui_slogan TEXT,                     -- Nuevo en v1.3
  ui_description TEXT,                -- Nuevo en v1.3
  launcher_messages JSONB,            -- Array de mensajes rotativos
  footer_text TEXT,
  msg_welcome TEXT,
  msg_suggestions JSONB,              -- Array de botones de respuesta rápida
  feat_voice BOOLEAN DEFAULT false,
  feat_files BOOLEAN DEFAULT true,
  feat_calendar BOOLEAN DEFAULT true,
  payment_link TEXT,
  consultation_price NUMERIC,
  notification_email TEXT,
  whatsapp_number TEXT,
  bot_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: ai_consultations (Logs de interacción IA)
CREATE TABLE IF NOT EXISTS ai_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id),
  client_id TEXT,
  visitor_id TEXT,
  session_id TEXT,
  user_message TEXT,
  ai_response JSONB,                  -- { text, suggestions, action, confidence }
  tokens_used INTEGER,
  model_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: n8n_chat_histories (Memoria de chat)
CREATE TABLE IF NOT EXISTS n8n_chat_histories (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  message JSONB NOT NULL,             -- Estructura de mensaje de n8n/LangChain
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: page_views (Analytics)
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT,
  visitor_id TEXT,
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sessions (Sesiones de usuario)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  client_id TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies (Ejemplo básico, ajustar según necesidades de seguridad)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lexflow_configs ENABLE ROW LEVEL SECURITY;

-- Policy: Solo permitir acceso por client_id (requiere configuración de auth.uid() o similar en Supabase)
-- CREATE POLICY "Access by client_id" ON leads FOR ALL USING (client_id = current_setting('app.current_client_id', true));
