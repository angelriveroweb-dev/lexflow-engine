import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ConfigLoader } from './core/ConfigLoader'
import type { LexFlowConfig } from './core/ConfigLoader'
import { getVisitorId, generateUUID } from './lib/utils'
import { createSupabaseClient } from './lib/supabase'

interface LexFlowOptions {
  id: string;
  container?: HTMLElement;
  supabaseUrl?: string;
  supabaseKey?: string;
  metadata?: Record<string, any>;
  webhookUrl?: string;
  sessionId?: string;
}

const init = async (options: LexFlowOptions) => {
  const container = options.container || document.createElement('div');
  if (!options.container) {
    container.id = 'lexflow-root';
    document.body.appendChild(container);
  }

  // Identity & Session Management (Source of Truth: CDN Engine)
  const visitorId = getVisitorId();
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  const now = Date.now();
  const lastActivity = localStorage.getItem('last_activity');

  // Prioritize a valid session ID from options or localStorage
  let sessionId = options.sessionId || localStorage.getItem('visitor_session_id');

  // Migration: Check for legacy session key if still not found
  if (!sessionId || sessionId === 'undefined') {
    const legacySessionId = localStorage.getItem(`lexflow_session_id_${options.id}`);
    if (legacySessionId && legacySessionId.length > 10) {
      sessionId = legacySessionId;
      localStorage.setItem('visitor_session_id', sessionId);
    }
  }

  const isNewSession = !sessionId || !lastActivity || (now - parseInt(lastActivity)) > SESSION_TIMEOUT;

  if (isNewSession) {
    sessionId = generateUUID();
    localStorage.setItem('visitor_session_id', sessionId!);
  }
  localStorage.setItem('last_activity', now.toString());

  // Load config
  const supabaseUrl = options.supabaseUrl || (import.meta as any).env.VITE_SUPABASE_URL || '';
  const supabaseKey = options.supabaseKey || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  // Track session_start if it's new
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

      const basePayload = {
        visitor_id: visitorId,
        page_path: window.location.pathname,
        client_id: options.id,
        metadata: {
          ...options.metadata,
          sessionId,
          visitorId,
          clientId: options.id,
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer || 'none',
          origin: 'lexflow_engine'
        }
      };

      // 1. Session Start (Conditional)
      if (isNewSession) {
        supabase.from('analytics_events').insert({
          ...basePayload,
          event_type: 'session_start',
        }).then(({ error }) => {
          if (error) console.error('LexFlow: Session tracking error', error);
        });
      }

      // 2. Page View (Mandatory on every init)
      supabase.from('analytics_events').insert({
        ...basePayload,
        event_type: 'page_view',
      }).then(({ error }) => {
        if (error) console.error('LexFlow: Page tracking error', error);
      });

    } catch (e) {
      console.error('LexFlow: Analytics failed', e);
    }
  }


  const loader = new ConfigLoader(supabaseUrl, supabaseKey);
  const config = await loader.fetchConfig(options.id);

  if (!config) {
    console.error('LexFlow: Failed to load configuration for ID:', options.id);
    return;
  }

  if (options.webhookUrl) {
    config.webhookUrl = options.webhookUrl;
  }

  // In the render block, ensure we pass the correct IDs back to the App
  const finalMetadata = {
    ...options.metadata,
    visitorId: (options.metadata?.visitorId && options.metadata.visitorId !== 'unknown') ? options.metadata.visitorId : visitorId,
    sessionId: sessionId
  };

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App
        config={config}
        metadata={finalMetadata}
        externalSessionId={sessionId!}
      />
    </React.StrictMode>
  );
}

// Expose to window
(window as any).LexFlow = { init };

// Auto-init if script has data-bot-id
const script = document.currentScript as HTMLScriptElement;
if (script) {
  const botId = script.getAttribute('data-bot-id');
  if (botId) {
    init({ id: botId });
  }
}

export { init, type LexFlowConfig, type LexFlowOptions };
