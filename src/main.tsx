import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { ConfigLoader } from './core/ConfigLoader'
import type { LexFlowConfig } from './core/ConfigLoader'

interface LexFlowOptions {
  id: string;
  container?: HTMLElement;
  supabaseUrl?: string;
  supabaseKey?: string;
  metadata?: Record<string, any>;
  sessionId?: string;
}

const init = async (options: LexFlowOptions) => {
  const container = options.container || document.createElement('div');
  if (!options.container) {
    container.id = 'lexflow-root';
    document.body.appendChild(container);
  }

  // Load config
  const supabaseUrl = options.supabaseUrl || (import.meta as any).env.VITE_SUPABASE_URL || '';
  const supabaseKey = options.supabaseKey || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

  const loader = new ConfigLoader(supabaseUrl, supabaseKey);
  const config = await loader.fetchConfig(options.id);

  if (!config) {
    console.error('LexFlow: Failed to load configuration for ID:', options.id);
    return;
  }

  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App
        config={config}
        metadata={options.metadata || {}}
        externalSessionId={options.sessionId}
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
