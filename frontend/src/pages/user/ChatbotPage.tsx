import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Bot, ArrowLeft, Sparkles, Wrench, Key, X, Check, Zap, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { motorcycleKnowledge } from '@/data/motorcycleKnowledge'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
  action?: {
    label: string
    serviceTypeId?: string
    serviceName?: string
  }
  isAiPowered?: boolean
}

interface ChatHistoryItem {
  role: 'user' | 'model'
  parts: { text: string }[]
}

const SUGGESTION_CHIPS = [
  'Motor Mogok / Mati',
  'Aki Soak / Starter Mati',
  'Ban Bocor / Kempes',
  'Rem Blong / Tidak Pakem',
]

// BACKEND URL (Sesuaikan portnya dengan server Express Anda)
const BACKEND_API_URL = 'http://localhost:5000/api/chatbot'

// ─── Local fallback jika Backend Server mati / error ─────────────────
const getLocalResponse = (query: string): { text: string; action?: { label: string; serviceTypeId?: string } } => {
  const q = query.toLowerCase()
  const matched = motorcycleKnowledge.find(e => e.keywords.some(k => q.includes(k)))

  if (matched) {
    let text = `🔧 **Ditemukan Diagnosis: ${matched.title}**\n\n`
    text += `📝 **Gejala:**\n${matched.symptom}\n\n`
    text += `❓ **Kemungkinan Penyebab:**\n`
    matched.causes.forEach(c => { text += `• ${c}\n` })
    text += `\n⚙️ **Langkah Mandiri (Kesulitan: ${matched.difficulty}):**\n`
    matched.solutions.forEach(s => { text += `• ${s}\n` })
    if (!matched.canSelfFix) {
      text += `\n⚠️ *Masalah ini sebaiknya ditangani oleh montir profesional.*`
    } else {
      text += `\n💡 *Jika langkah di atas belum berhasil, silakan panggil montir.*`
    }
    return {
      text,
      action: { label: matched.canSelfFix ? 'Panggil Montir Sekarang' : `Panggil Montir untuk ${matched.serviceName}`, serviceTypeId: matched.serviceTypeId }
    }
  }

  return {
    text: `Maaf, saya belum mengenali keluhan tersebut. Coba deskripsikan lebih spesifik seperti: **motor mogok**, **ban bocor**, **aki soak**, atau **rem blong**.\n\nAsisten AI kami siap membantu mendiagnosis masalah Anda secara cerdas! 🚀`,
    action: { label: 'Cari Montir Terdekat' }
  }
}

// ─── Parse Gemini response untuk mencari action tag [RECOMMEND_MECHANIC] ───
const parseGeminiAction = (text: string) => {
  const tagRegex = /\[RECOMMEND_MECHANIC:([\w-]+):([^\]]+)\]/
  const match = text.match(tagRegex)
  if (match) {
    const cleanText = text.replace(tagRegex, '').trim()
    return {
      text: cleanText,
      action: { label: `Panggil Montir — ${match[2]}`, serviceTypeId: match[1], serviceName: match[2] }
    }
  }
  return { text, action: undefined }
}

// ════════════════════════════════════════════════════════════════
export default function ChatbotPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Karena API Key sekarang aman di Express, state ini kita gunakan untuk memantau status koneksi server
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true)
  const [history, setHistory] = useState<ChatHistoryItem[]>([])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: `Halo ${user?.name?.split(' ')[0] || 'Pengguna'}! Saya **Mona Bot**, Asisten AI Go-Montir. 🤖\n\nSilakan tanyakan kendala motor Anda — saya akan mendiagnosis penyebab kerusakan dan memandu penanganan mandiri!`,
      sender: 'bot',
      timestamp: new Date(),
      isAiPowered: true
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // ─── Fungsi Kirim Pesan (Integrasi Express) ───────────────────────────
  const handleSend = useCallback(async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // Tembak ke Express backend
      const response = await fetch(BACKEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: history, // Teruskan history agar Gemini ingat konteks obrolan
        }),
      })

      if (!response.ok) {
        throw new Error('Respons server bermasalah')
      }

      const data = await response.json()

      if (data.reply) {
        const { text: cleanText, action } = parseGeminiAction(data.reply)

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: cleanText,
          sender: 'bot',
          timestamp: new Date(),
          action,
          isAiPowered: true,
        }

        setMessages(prev => [...prev, botMessage])
        setIsServerConnected(true)

        // Update history percakapan lokal untuk request berikutnya
        setHistory(prev => [
          ...prev,
          { role: 'user', parts: [{ text: text }] },
          { role: 'model', parts: [{ text: data.reply }] }
        ])
      } else {
        throw new Error('Format balasan server salah')
      }

    } catch (err) {
      console.error('Frontend Chat Error:', err)
      setIsServerConnected(false)

      // Fallback Otomatis ke Mode Lokal jika server mati/error
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ **Koneksi AI Terganggu.** Menggunakan sistem pencarian lokal sebagai cadangan...`,
        sender: 'bot',
        timestamp: new Date(),
      }

      const { text: fallbackText, action } = getLocalResponse(text)
      const fallbackMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: fallbackText,
        sender: 'bot',
        timestamp: new Date(),
        action: action ? { label: action.label, serviceTypeId: action.serviceTypeId } : undefined,
        isAiPowered: false,
      }

      setMessages(prev => [...prev, errorMessage, fallbackMessage])
    } finally {
      setIsTyping(false)
    }
  }, [history])

  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const boldRegex = /\*\*(.*?)\*\*/g
      const parts: (string | React.ReactElement)[] = []
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) parts.push(line.substring(lastIndex, match.index))
        parts.push(<strong key={`b-${i}-${match.index}`} className="font-extrabold text-white">{match[1]}</strong>)
        lastIndex = boldRegex.lastIndex
      }
      if (lastIndex < line.length) parts.push(line.substring(lastIndex))

      return (
        <div key={i} className={line.trim() === '' ? 'h-2' : 'min-h-[1.25rem]'}>
          {parts.length > 0 ? parts : line}
        </div>
      )
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-slate-900 overflow-hidden relative max-w-lg mx-auto">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary relative">
                <Bot className="w-5 h-5" />
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${isServerConnected ? 'bg-success' : 'bg-warning'}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-bold text-white text-sm">Mona Bot</h1>
                  {isServerConnected ? (
                    <span className="flex items-center gap-1 text-[9px] font-black text-success bg-success/10 px-1.5 py-0.5 rounded-full border border-success/20">
                      <Zap className="w-2.5 h-2.5" /> AI ONLINE
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] font-black text-warning bg-warning/10 px-1.5 py-0.5 rounded-full border border-warning/20">
                      LOCAL MODE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">Deteksi Kerusakan Motor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        {messages.map((message) => {
          const isBot = message.sender === 'bot'
          return (
            <div
              key={message.id}
              className={`flex items-start gap-2.5 max-w-[88%] ${isBot ? 'self-start' : 'self-end ml-auto flex-row-reverse'}`}
            >
              {isBot && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-primary flex-shrink-0 ${message.isAiPowered
                  ? 'bg-primary/20 border border-primary/40'
                  : 'bg-primary/10 border border-primary/20'
                  }`}>
                  {message.isAiPowered ? <Zap className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
                </div>
              )}

              <div className="flex flex-col">
                {isBot && message.isAiPowered && (
                  <span className="text-[9px] text-success font-bold mb-0.5 flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Gemini AI
                  </span>
                )}
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${isBot
                  ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50'
                  : 'bg-primary text-white rounded-tr-none font-medium'
                  }`}>
                  {renderMessageText(message.text)}

                  {message.action && (
                    <button
                      onClick={() => navigate('/search', { state: { serviceTypeId: message.action?.serviceTypeId } })}
                      className="mt-3 w-full py-2.5 px-4 text-white text-xs font-black rounded-xl transition-all duration-200 shadow-md cursor-pointer flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #F97316, #EA6C00)', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      {message.action.label}
                    </button>
                  )}
                </div>
                <span className={`text-[9px] text-slate-500 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex items-start gap-2.5 max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input bar ────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SUGGESTION_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="text-xs px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex-shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              {chip}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend(inputValue)}
            placeholder="Tanya apa saja tentang kendala motor Anda..."
            className="flex-1 bg-slate-800/80 border border-slate-700 focus:border-primary text-slate-100 placeholder-slate-400 text-sm px-4 py-3 rounded-xl outline-none transition-all duration-200"
          />
          <button
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md ${inputValue.trim() && !isTyping
              ? 'bg-primary text-white hover:scale-105 active:scale-95 shadow-primary/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}