import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'
import { useChat } from './hooks/useChat'
import { ChatWindow } from './components/chat/ChatWindow'
import { ChatInput } from './components/chat/ChatInput'
import type { LexFlowConfig } from './core/ConfigLoader'

function App({ config }: { config: LexFlowConfig }) {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, isAnalyzing, sendMessage, sessionId } = useChat({ config })

  return (
    <div className="lexflow-engine font-sans">
      {/* Launcher Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 p-4 rounded-full shadow-2xl transition-all z-[9999] flex items-center justify-center group"
        style={{
          backgroundColor: config.ui.primaryColor,
          boxShadow: `0 10px 25px -5px ${config.ui.primaryColor}50`
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="text-white" size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex items-center gap-2"
            >
              <MessageCircle className="text-white" size={24} />
              <span className="text-white font-semibold max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap px-0 group-hover:px-1">
                {config.ui.launcherLabel}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-5 w-[95vw] max-w-[420px] h-[600px] max-h-[80vh] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col z-[9999] border border-gray-100"
          >
            {/* Header */}
            <div
              className={`p-5 text-white bg-gradient-to-r ${config.ui.gradient} flex items-center justify-between shadow-lg relative z-10`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl border-2 border-white/20 overflow-hidden shadow-inner bg-white/10 backdrop-blur-sm">
                  {config.ui.avatarUrl ? (
                    <img src={config.ui.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xl font-bold">{config.ui.title[0]}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">{config.ui.title}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                    <span className="text-[11px] font-medium text-white/80">{config.ui.subtitle}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content area */}
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              isAnalyzing={isAnalyzing}
              onSend={sendMessage}
              sessionId={sessionId}
              config={config}
            />

            {/* Footer / Input */}
            <ChatInput
              onSend={sendMessage}
              isLoading={isLoading}
              primaryColor={config.ui.primaryColor}
              gradient={config.ui.gradient}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
