import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { orderApi } from '@/services'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  text: string
  senderId: string
  createdAt: string
  sender: {
    id: string
    name: string
    role: string
  }
}

interface ChatDrawerProps {
  isOpen: boolean
  onClose: () => void
  orderId: string
  socket: any
  recipientName: string
}

export default function ChatDrawer({ isOpen, onClose, orderId, socket, recipientName }: ChatDrawerProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && orderId) {
      loadChatHistory()
    }
  }, [isOpen, orderId])

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: ChatMessage) => {
      setMessages(prev => {
        // Prevent duplicate messages if already in state
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message]
      })
      scrollToBottom()
    }

    socket.on('new_message', handleNewMessage)
    return () => {
      socket.off('new_message', handleNewMessage)
    }
  }, [socket])

  const loadChatHistory = async () => {
    setIsLoading(true)
    try {
      const res = await orderApi.getChatHistory(orderId)
      setMessages(res.data.data)
      setTimeout(scrollToBottom, 100)
    } catch (err) {
      console.error('Failed to load chat history', err)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    const text = newMessage.trim()
    setNewMessage('')
    
    // Emit to socket
    socket.emit('send_message', { orderId, text })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed bottom-0 left-0 right-0 h-[80vh] max-h-[800px] bg-slate-900 rounded-t-3xl border border-slate-800 flex flex-col z-[101] max-w-lg mx-auto shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
              <div>
                <h3 className="text-lg font-bold text-white">Chat dengan {recipientName}</h3>
                <p className="text-xs text-primary flex items-center gap-1.5 font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Real-time
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3 opacity-50">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Send className="w-6 h-6 ml-1 text-slate-600" />
                  </div>
                  <p className="text-sm font-medium">Mulai obrolan sekarang</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === user?.id
                  return (
                    <div 
                      key={msg.id || index} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-2xl ${
                          isMe 
                            ? 'bg-primary text-white rounded-tr-sm' 
                            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm'
                        }`}
                      >
                        <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium mt-1 mx-1">
                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-primary text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all shadow-glow flex-shrink-0"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
