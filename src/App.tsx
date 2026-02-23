import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle, Trash2, ArrowLeft, Bot } from 'lucide-react'
import { useChat } from './hooks/useChat'
import { ChatWindow } from './components/chat/ChatWindow'
import { ChatInput } from './components/chat/ChatInput'
import type { LexFlowConfig } from './core/ConfigLoader'

function App({ config, metadata, externalSessionId }: {
  config: LexFlowConfig,
  metadata?: Record<string, any>,
  externalSessionId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, isAnalyzing, sendMessage, sessionId, clearHistory, abortRequest } = useChat({
    config,
    metadata,
    externalSessionId
  })
  const [hookIndex, setHookIndex] = useState(0)

  const launcherMessages = config.ui.launcherMessages || [
    'Secretaría en línea - ¿En qué puedo asistirle?',
    'Consulta Prioritaria: Disponibilidad inmediata',
    'Hable con un especialista ahora'
  ]

  useEffect(() => {
    if (!isOpen) {
      const interval = setInterval(() => {
        setHookIndex((prev) => (prev + 1) % launcherMessages.length)
      }, 5000)

      // Exit Intent Logic (replicated from landing)
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          setIsOpen(true)
        }
      }
      document.addEventListener('mouseleave', handleMouseLeave)

      return () => {
        clearInterval(interval)
        document.removeEventListener('mouseleave', handleMouseLeave)
      }
    } else {
      // Abandonment / Activity Sync
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden' && sessionId) {
          const effectiveClientId = metadata?.clientId || config.id;
          const effectiveVisitorId = localStorage.getItem('visitor_id') || '';

          const data = {
            sessionId: sessionId,
            text: '[User left page]',
            clientId: effectiveClientId,
            visitorId: effectiveVisitorId,
            action: 'user_abandoned_page',
            metadata: JSON.stringify({
              clientId: effectiveClientId,
              visitorId: effectiveVisitorId,
              url: window.location.href,
              timestamp: new Date().toISOString(),
              ...metadata
            })
          };

          if (navigator.sendBeacon) {
            const payload = JSON.stringify(data);
            // Send to main webhook (chat flow)
            navigator.sendBeacon(config.webhookUrl, payload);
            // Send to El Rescatista (lead retention workflow)
            const rescatistaUrl = config.webhookUrl.replace(/\/webhook\/.*$/, '/webhook/lead-abandonment');
            navigator.sendBeacon(rescatistaUrl, payload);
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, [isOpen, launcherMessages.length, sessionId, config.id, config.webhookUrl, metadata]);

  return (
    <div className="lexflow-engine font-sans selection:bg-[#C6A87C]/30 selection:text-white">
      {/* Launcher Button & Hook Messages */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3">
            {/* Hook Messages - Pill Style */}
            <AnimatePresence mode="wait">
              <motion.div
                key={hookIndex}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.9 }}
                className="bg-zinc-950/90 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full shadow-2xl"
              >
                <p className="text-sm font-medium text-white tracking-tight">
                  {launcherMessages[hookIndex]}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="relative">
              {/* Pulse Effect */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-[#C6A87C] blur-md"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="relative w-16 h-16 rounded-full shadow-2xl shadow-[#C6A87C]/30 transition-all flex items-center justify-center group bg-zinc-900 border-2 border-white/10"
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
                  {config.ui.avatarUrl ? (
                    <img
                      src={config.ui.avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full bg-zinc-800">
                      <MessageCircle className="text-[#C6A87C]" size={28} />
                    </div>
                  )}
                </div>

                {/* Notification Badge - Red as screenshot */}
                <motion.span
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-zinc-950 flex items-center justify-center text-[10px] font-bold text-white shadow-lg pointer-events-none z-10"
                >
                  1
                </motion.span>
              </motion.button>
              {/* Soft glow behind the avatar icon */}
              <div className="absolute inset-0 bg-[#C6A87C] blur-[20px] opacity-20 z-[-1] rounded-full animate-pulse pointer-events-none"></div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="fixed z-[10000] inset-0 w-full h-[100dvh] rounded-none md:inset-auto md:bottom-20 md:right-6 md:w-[400px] md:h-[650px] md:max-h-[85vh] md:max-w-[calc(100vw-3rem)] md:rounded-3xl flex flex-col bg-zinc-950 md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border-0 md:border md:border-white/5 overflow-hidden md:ring-1 md:ring-white/10"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="md:hidden p-2 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-white/10 p-0.5 shadow-lg overflow-hidden">
                    {config.ui.avatarUrl ? (
                      <img src={config.ui.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-[#C6A87C]">
                        <Bot size={24} />
                      </div>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-950 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-base tracking-tight leading-none mb-1">{config.ui.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{config.ui.subtitle}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearHistory}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  title="Reiniciar chat"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hidden md:flex p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-zinc-950">
              <ChatWindow
                messages={messages}
                isLoading={isLoading}
                isAnalyzing={isAnalyzing}
                onSend={sendMessage}
                onAbort={abortRequest}
                sessionId={sessionId}
                config={config}
              />
            </div>

            {/* Footer / Input */}
            <div className="p-5 bg-zinc-900/50 backdrop-blur-xl border-t border-white/5">
              <ChatInput
                onSend={sendMessage}
                isLoading={isLoading || isAnalyzing}
                primaryColor={config.ui.primaryColor}
                gradient={config.ui.gradient}
              />
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2 opacity-30">
                  <div className="h-[1px] w-8 bg-zinc-500"></div>
                  <span className="text-[9px] text-zinc-400 font-bold tracking-[0.2em] uppercase">
                    {config.ui.footerText}
                  </span>
                  <div className="h-[1px] w-8 bg-zinc-500"></div>
                </div>
                <p className="text-[8px] text-zinc-600 font-medium tracking-widest uppercase">
                  LexFlow Engine v1.0
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
